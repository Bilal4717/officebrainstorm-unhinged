import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { CHARACTERS } from "../../client/src/lib/characters.js";

///////////////////////////////////////////////////////////////////////////
// Define proper agent interfaces with Zod schemas
///////////////////////////////////////////////////////////////////////////
const CharacterResponseSchema = z.object({
  action: z.enum(["skip", "comment", "propose"]),
  message: z.string(),
  stickyNotes: z.array(
    z.object({
      content: z.string(),
    }),
  ),
  prosandcons: z.array(
    z.object({
      stickyNoteId: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    }),
  ),
});

const VotingResponseSchema = z.object({
  message: z.string(),
  votes: z.array(z.number()),
  reasoning: z.string(),
});

export type CharacterResponse = z.infer<typeof CharacterResponseSchema>;
export type VotingResponse = z.infer<typeof VotingResponseSchema>;

export interface BrainstormState {
  topic: string;
  participants: Array<{
    name: string;
    role: string;
    type: string;
  }>;
  discussion: Array<{
    speaker: string;
    message: string;
    avatar: string;
    type: string;
  }>;
  stickyNotes: Array<{
    id: string;
    author: string;
    avatar: string;
    content: string;
    timestamp: string;
    votes: number;
    votedBy: string[];
    pros: string[];
    cons: string[];
    hasAnalysis: boolean;
    color: string;
  }>;
  exchangeCount: number;
}

export interface BrainstormAgent {
  name: string;
  avatar: string;
  respond(state: BrainstormState): Promise<CharacterResponse>;
  vote(
    stickyNotes: Array<{
      id: string;
      author: string;
      avatar: string;
      content: string;
      timestamp: string;
      votes: number;
      votedBy: string[];
      pros: string[];
      cons: string[];
      hasAnalysis: boolean;
      color: string;
    }>,
    state: BrainstormState,
  ): Promise<VotingResponse>;
}

export interface SummaryAgent {
  name: string;
  generateKeyTakeaways(context: {
    topic: string;
    discussion: Array<{ speaker: string; message: string }>;
    votingRationale: Array<{ speaker: string; reasoning: string }>;
    participantStats: Array<{
      name: string;
      role: string;
      stickyNotesCreated: number;
      undiscussedCards: number;
    }>;
    stickyNotes: Array<{
      id: string;
      author: string;
      content: string;
      votes: number;
      votedBy: string[];
    }>;
  }): Promise<{ keyTakeaways: string[] }>;
}

///////////////////////////////////////////////////////////////////////////
// LLM setup
///////////////////////////////////////////////////////////////////////////
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama3-70b-8192",
  temperature: 0.8,
});

const aiAssistantLlm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "compound-beta-mini",
  temperature: 0.3,
});

///////////////////////////////////////////////////////////////////////////
// Agent implementations
///////////////////////////////////////////////////////////////////////////
export class CharacterAgent implements BrainstormAgent {
  name: string;
  avatar: string;
  role: string;
  personality: string;

  constructor(name: string, avatar: string, role: string, personality: string) {
    this.name = name;
    this.avatar = avatar;
    this.role = role;
    this.personality = personality;
  }

  async respond(state: BrainstormState): Promise<CharacterResponse> {
    const prompt = `You are ${this.name} from The Office, ${this.role}.

TOPIC: ${state.topic}

CURRENT STICKY NOTES:
${state.stickyNotes.map((s) => `ID: ${s.id}\nContent: "${s.content}"\nAuthor: ${s.author}`).join("\n\n")}

RECENT DISCUSSION: ${state.discussion
      .slice(-3)
      .map((d) => `${d.speaker}: "${d.message}"`)
      .join(", ")}

Your personality: ${this.personality}

Respond as ${this.name} with either:
1. "skip" if you think it's best to keep silent for now and let others speak
2. "comment" if you want to comment without sticky notes
3. "propose" if you want to add sticky notes OR add pros and cons on existing sticky notes

When selecting "Propose", you MUST choose ONLY ONE of these paths:
PATH A - Adding New Ideas: Create up to 2 new sticky notes (50 characters each). Set prosandcons to empty array [].
PATH B - Analyzing Existing Ideas: Add pros/cons to existing sticky notes from OTHER participants. Set stickyNotes to empty array [].

CRITICAL: You cannot do both in the same response. Choose either PATH A or PATH B, never both.

CRITICAL RULES: 
- Use EXACT sticky note IDs from the list above
- Only analyze sticky notes by OTHER participants, not your own
- Copy IDs exactly (like "erin-hannon-1751796201869-0.11363990954698111")

Format your response as JSON with exactly this structure:
{
  "action": "skip|comment|propose",
  "prosandcons": [{"stickyNoteId": "use-exact-ID-from-above-list", "pros": ["I love this idea because...", "This would really help..."], "cons": ["But I'm worried that...", "This might be confusing..."]}],
  "stickyNotes": [{"content": "Earth Welcome Kit basics"}],
  "message": "Your critique as ${this.name}. Repeat what you have have added in the stickyNotes. Also talk about each pro or cons you have added in the prosandcons list. Bring your full self—your personality, opinions, and unique voice. Under 400 chars.",
}

Note: prosandcons array should be empty [] if no existing sticky notes to analyze.`;

    let output: any = null;
    let content: string = "";

    try {
      output = await llm.invoke([new HumanMessage(prompt)]);
      content = output.content as string;

      // Clean up content - extract JSON if wrapped in markdown
      if (content.includes("```json")) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        }
      }

      // Remove any extra characters after the closing brace
      const lastBrace = content.lastIndexOf("}");
      if (lastBrace !== -1) {
        content = content.substring(0, lastBrace + 1);
      }

      const parsed = JSON.parse(content);
      return CharacterResponseSchema.parse(parsed);
    } catch (error) {
      console.log(`🚨 ${this.name} FAILED TO PARSE RESPONSE:`, error);
      console.log(`🚨 Raw LLM output was:`, output?.content);
      console.log(`🚨 Cleaned content was:`, content);
      return {
        action: "comment",
        message: this.getDefaultMessage(),
        prosandcons: [],
        stickyNotes: [],
      };
    }
  }

  async vote(
    stickyNotes: Array<{
      id: string;
      content: string;
      author: string;
      votes: number;
      votedBy: string[];
    }>,
    state: BrainstormState,
  ): Promise<VotingResponse> {
    const prompt = `You are ${this.name} voting on sticky note ideas.

TOPIC: ${state.topic}
STICKY NOTES TO VOTE ON:
${stickyNotes.map((note, i) => `${i + 1}. "${note.content}" by ${note.author}`).join("\n")}

Your personality: ${this.personality}

As ${this.name}, pick your top 3 favorite sticky notes (by position number 1-${stickyNotes.length}) based on your personality.

Format as JSON:
{
  "message": "your voting explanation as ${this.name}",
  "votes": [1, 3, 5],
  "reasoning": "why you picked these based on your personality, keep it under 400 characters."
}`;

    try {
      const output = await llm.invoke([new HumanMessage(prompt)]);
      let responseText = output.content as string;

      // Extract JSON from response if it contains extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }

      const parsed = JSON.parse(responseText);
      return VotingResponseSchema.parse(parsed);
    } catch (error) {
      return {
        message: this.getDefaultVoteMessage(),
        votes: [1, 2, 3],
        reasoning: `${this.name}'s choice`,
      };
    }
  }

  private getDefaultMessage(): string {
    // Return character-specific fallback messages that still encourage specific critique
    const messages = [
      "Let me be specific about what I think of these sticky notes...",
      "I have strong opinions about some of these ideas!",
      "Some of these sticky notes are better than others, let me explain...",
      "I need to comment on a few of these specific ideas...",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private getDefaultVoteMessage(): string {
    return "Good choices overall.";
  }
}

///////////////////////////////////////////////////////////////////////////
// AI Assistant Agent
///////////////////////////////////////////////////////////////////////////
export class AIAssistantAgent implements BrainstormAgent {
  name = "AI Assistant";
  avatar = "/images/robot.png";
  description =
    "Facilitator who encourages participation without proposing ideas.";

  async respond(state: BrainstormState): Promise<CharacterResponse> {
    // Calculate current participant stats for analysis
    const participantStats = (state.participants || [])
      .filter((p) => p.type !== "ai") // Exclude AI assistant from analytics
      .map((p) => {
        const userNotes = (state.stickyNotes || []).filter(
          (note) => note.author === p.name,
        );
        const undiscussedCards = userNotes.filter(
          (note) =>
            !note.hasAnalysis ||
            (note.pros.length === 0 && note.cons.length === 0),
        ).length;

        return {
          name: p.name,
          role: p.role,
          stickyNotesCreated: userNotes.length,
          undiscussedCards: undiscussedCards,
        };
      });

    const prompt = `You are an AI agent facilitating a brainstorm session. Your role is to nudge the discussion to make sure it is healthy.

TOPIC: ${state.topic}

CURRENT PARTICIPANT STATISTICS:
${participantStats.map((p) => `${p.name} (${p.role}): ${p.stickyNotesCreated} ideas created, ${p.undiscussedCards} undiscussed`).join("\n")}

CURRENT STICKY NOTES: ${state.stickyNotes.map((s) => `"${s.content}" by ${s.author}${s.hasAnalysis ? " [discussed]" : " [undiscussed]"}`).join(", ")}

RECENT DISCUSSION: ${state.discussion
      .slice(-3)
      .map((d) => `${d.speaker}: "${d.message}"`)
      .join(", ")}

HEALTHINESS OF DISCUSSION:
A healthy discussion is one where participants are contributing about the same number of ideas and where all the ideas are being discussed.

In order to encourage a healthy brainstorm, choose one of the following 5 actions:
A Encourage a specific participant that is not posting enough stickies to add some (name them by role/name)
B Encourage participants to add pros and cons about specific sticky (name it) 
C Discourage participants from posting too many ideas if there's imbalance
D Discourage participants from adding pros and cons to a sticky that has already plenty of pros and cons (name it)
E Post a fun fact found on the Internet about the current discussion to bring some levity to the discussion

In any case:
- NEVER propose sticky note ideas
- NEVER add pros and cons to ideas
- NEVER vote on ideas

Format your response as JSON with exactly this structure:
{
  "action": "comment",
  "message": "your facilitation message",
  "prosandcons": [],
  "stickyNotes": []
}

ALways respond action set a 'comment' (NEVER use "participate")`;

    try {
      const output = await aiAssistantLlm.invoke([new HumanMessage(prompt)]);
      let content = output.content as string;

      console.log("🔍 Raw AI Assistant response:", content);

      // Clean up content - extract JSON if wrapped in markdown
      if (content.includes("```json")) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        }
      }

      // Try to extract JSON from the response if it's mixed with text
      let jsonContent = content;
      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonContent = content.substring(jsonStart, jsonEnd + 1);
      }

      console.log("🔍 Cleaned AI Assistant JSON:", jsonContent);

      const parsed = JSON.parse(jsonContent);

      // Validate and normalize the response
      const normalizedResponse = {
        action: parsed.action || "comment",
        message: parsed.message || "Great ideas everyone! Any other thoughts?",
        prosandcons: Array.isArray(parsed.prosandcons)
          ? parsed.prosandcons
          : [],
        stickyNotes: [], // AI Assistant never creates sticky notes
      };

      console.log("🔍 Normalized AI Assistant response:", normalizedResponse);

      return CharacterResponseSchema.parse(normalizedResponse);
    } catch (error) {
      console.log("🚨 AI Assistant parsing error:", error);
      return {
        action: "comment",
        message: "Great ideas everyone! Any other thoughts?",
        prosandcons: [],
        stickyNotes: [],
      };
    }
  }

  async vote(
    stickyNotes: Array<{
      id: string;
      content: string;
      author: string;
      votes: number;
      votedBy: string[];
    }>,
    state: BrainstormState,
  ): Promise<VotingResponse> {
    // AI Assistant never votes
    return {
      message: "As the facilitator, I don't vote on ideas.",
      votes: [],
      reasoning: "Maintaining neutrality",
    };
  }
}

///////////////////////////////////////////////////////////////////////////
// Key Takeaways Agent
///////////////////////////////////////////////////////////////////////////
export class KeyTakeawaysAgent implements SummaryAgent {
  name = "Key Takeaways";

  // Commented out Groq implementation
  // private summaryLlm = new ChatGroq({
  //   apiKey: process.env.GROQ_API_KEY!,
  //   model: "llama-3.3-70b-versatile", // Use more capable model
  //   temperature: 0.1, // Lower temperature for more consistent JSON
  // });

  // Vultr API helper method
  private async callVultrAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.vultrinference.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VULTR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-instruct-fp8",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates key takeaways from brainstorming sessions. Always respond with valid JSON in the requested format."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        stream: false,
        max_tokens: 512,
        temperature: 0.1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      throw new Error(`Vultr API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateKeyTakeaways(context: {
    topic: string;
    discussion: Array<{ speaker: string; message: string }>;
    votingRationale: Array<{ speaker: string; reasoning: string }>;
    participantStats: Array<{
      name: string;
      role: string;
      stickyNotesCreated: number;
      undiscussedCards: number;
    }>;
    stickyNotes: Array<{
      id: string;
      author: string;
      content: string;
      votes: number;
      votedBy: string[];
    }>;
  }): Promise<{ keyTakeaways: string[] }> {
    const discussionSummary = context.discussion
      .map((d) => `${d.speaker}: ${d.message}`)
      .join("\n");

    const votingAnalysis = context.votingRationale
      .map((v) => `${v.speaker} voted because: ${v.reasoning}`)
      .join("\n");

    // Sort sticky notes by vote count to find the top ideas
    const sortedNotes = context.stickyNotes
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5); // Get top 5 for context

    const voteCountAnalysis = sortedNotes
      .map(
        (note) =>
          `"${note.content}" by ${note.author}: ${note.votes} votes (voted by: ${note.votedBy.join(", ")})`,
      )
      .join("\n");

    const prompt = `Based on this brainstorm session about "${context.topic}", synthesize the group's answer based on the ideas that got the most votes. Please make sure to follow the format described in the topic. If for instance it asks for 3 ideas, make sure to provide 3 ideas.

ACTUAL VOTE COUNTS (sorted by most votes):
${voteCountAnalysis}

DISCUSSION SUMMARY:
${discussionSummary}

VOTING REASONS:
${votingAnalysis}

CRITICAL: Base your key takeaways on the actual vote counts above. Select the ideas with the highest number of votes and explain their benefits based on the discussion and voting reasons.

Output only JSON (in case 3 ideas were expected):
{"keyTakeaways":["idea 1 and its benefits","idea 2 and its benefits","idea 2 and its benefits"]}`;

    try {
      let content = await this.callVultrAPI(prompt);

      console.log(
        "🔍 Raw KeyTakeaways response:",
        content.substring(0, 200) + "...",
      );

      // Clean up content - extract JSON if wrapped in markdown
      if (content.includes("```json")) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        }
      }

      // Find the first { and last } to extract valid JSON
      const firstBrace = content.indexOf("{");
      const lastBrace = content.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        content = content.substring(firstBrace, lastBrace + 1);
      }

      console.log("🔍 Cleaned JSON:", content);

      const parsed = JSON.parse(content);
      const takeaways = parsed.keyTakeaways || [];

      console.log("✅ Generated specific takeaways:", takeaways);

      return { keyTakeaways: takeaways };
    } catch (error) {
      console.log("⚠️ KeyTakeaways JSON parsing failed:", error);

      // Generate contextual fallback based on actual session data
      const mainParticipant =
        context.votingRationale[0]?.speaker || "participants";

      return {
        keyTakeaways: [
          "Discussion generated valuable insights through character perspectives",
          `${mainParticipant} and others prioritized ideas that balanced creativity with practicality`,
          "The voting process revealed community preferences for collaborative solutions",
        ],
      };
    }
  }
}

///////////////////////////////////////////////////////////////////////////
// Register all agents
///////////////////////////////////////////////////////////////////////////
export const agents: BrainstormAgent[] = [
  // Create character agents for all available characters
  ...CHARACTERS.map(
    (char) =>
      new CharacterAgent(char.name, char.avatar, char.role, char.personality),
  ),
  new AIAssistantAgent(),
];

export const keyTakeawaysAgent = new KeyTakeawaysAgent();
