import { StateGraph, END, START } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { BrainstormResults } from "@shared/schema";
import {
  agents,
  keyTakeawaysAgent,
  BrainstormAgent,
  BrainstormState,
} from "./brainstorm-agents";
import { CHARACTERS } from "../../client/src/lib/characters.js";

///////////////////////////////////////////////////////////////////////////
// LangGraph State Management
///////////////////////////////////////////////////////////////////////////
const BrainstormStateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  selectedCharacters: Annotation<string[]>,
  aiAssistant: Annotation<boolean>,
  userParticipation: Annotation<boolean>,
  userName: Annotation<string>,
  userRole: Annotation<string>,
  participants: Annotation<
    Array<{
      name: string;
      role: string;
      avatar: string;
      type: "character" | "ai" | "user";
      color: string;
    }>
  >,
  discussion: Annotation<
    Array<{
      speaker: string;
      message: string;
      avatar: string;
      type: "character" | "ai" | "user";
    }>
  >,
  stickyNotes: Annotation<
    Array<{
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
    }>
  >,
  keyTakeaways: Annotation<string[]>,
  participantStats: Annotation<
    Array<{
      name: string;
      role: string;
      stickyNotesCreated: number;
      undiscussedCards?: number;
    }>
  >,
  currentSpeaker: Annotation<number>,
  exchangeCount: Annotation<number>,
  nonAiTurnCount: Annotation<number>,
  votingPhase: Annotation<boolean>,
  votingResults: Annotation<any>,
  analysisPhase: Annotation<boolean>,
  isComplete: Annotation<boolean>,
});

type BrainstormStateType = typeof BrainstormStateAnnotation.State;

///////////////////////////////////////////////////////////////////////////
// Character profiles for participant setup - using enhanced character data
///////////////////////////////////////////////////////////////////////////
const CHARACTER_PROFILES: Record<string, any> = {
  dwight: {
    ...CHARACTERS.find((char) => char.id === "dwight"),
    color: "red",
  },
  erin: {
    ...CHARACTERS.find((char) => char.id === "erin"),
    color: "yellow",
  },
  jan: {
    ...CHARACTERS.find((char) => char.id === "jan"),
    color: "purple",
  },
  jim: {
    ...CHARACTERS.find((char) => char.id === "jim"),
    color: "green",
  },
  karen: {
    ...CHARACTERS.find((char) => char.id === "karen"),
    color: "orange",
  },
  kevin: {
    ...CHARACTERS.find((char) => char.id === "kevin"),
    color: "teal",
  },
  michael: {
    ...CHARACTERS.find((char) => char.id === "michael"),
    color: "blue",
  },
  pam: {
    ...CHARACTERS.find((char) => char.id === "pam"),
    color: "pink",
  },
};

// Utility functions
function getCharacterColor(
  speaker: string,
  selectedCharacters: string[],
): string {
  for (const charId of selectedCharacters) {
    if (CHARACTER_PROFILES[charId].name === speaker) {
      return CHARACTER_PROFILES[charId].color;
    }
  }
  return "gray";
}

///////////////////////////////////////////////////////////////////////////
// Event streaming
///////////////////////////////////////////////////////////////////////////
let streamingCallbacks: Map<number, (data: any) => void> = new Map();
let sessionState: Map<
  number,
  { participants?: any[]; currentSpeaker?: any; status?: any }
> = new Map();
let userInputQueue: Map<number, any> = new Map();
let userInputResolvers: Map<number, (input: any) => void> = new Map();

export function subscribeToSession(
  sessionId: number,
  callback: (data: any) => void,
) {
  streamingCallbacks.set(sessionId, callback);

  const currentState = sessionState.get(sessionId);
  if (currentState) {
    if (currentState.participants) {
      callback({
        type: "participants",
        data: currentState.participants,
        timestamp: new Date().toISOString(),
      });
    }
    if (currentState.currentSpeaker) {
      callback({
        type: "currentSpeaker",
        data: currentState.currentSpeaker,
        timestamp: new Date().toISOString(),
      });
    }
    if (currentState.status) {
      callback({
        type: "status",
        data: currentState.status,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export function unsubscribeFromSession(sessionId: number) {
  streamingCallbacks.delete(sessionId);
}

function emitUpdate(sessionId: number, type: string, data: any) {
  const callback = streamingCallbacks.get(sessionId);
  if (callback) {
    callback({ type, data, timestamp: new Date().toISOString() });
  }

  if (!sessionState.has(sessionId)) {
    sessionState.set(sessionId, {});
  }

  const state = sessionState.get(sessionId)!;
  if (type === "participants") {
    state.participants = data;
  } else if (type === "currentSpeaker") {
    state.currentSpeaker = data;
  } else if (type === "status") {
    state.status = data;
  }
}

export function submitUserInput(sessionId: number, input: any) {
  const resolver = userInputResolvers.get(sessionId);
  if (resolver) {
    resolver(input);
    userInputResolvers.delete(sessionId);
  } else {
    userInputQueue.set(sessionId, input);
  }
}

function waitForUserInput(sessionId: number): Promise<any> {
  return new Promise((resolve) => {
    const existingInput = userInputQueue.get(sessionId);
    if (existingInput) {
      userInputQueue.delete(sessionId);
      resolve(existingInput);
    } else {
      userInputResolvers.set(sessionId, resolve);
    }
  });
}

///////////////////////////////////////////////////////////////////////////
// Main workflow functions
///////////////////////////////////////////////////////////////////////////
async function initializeSession(
  state: BrainstormStateType,
): Promise<Partial<BrainstormStateType>> {
  console.log(
    "🔍 initializeSession called with state:",
    JSON.stringify(
      {
        topic: state.topic,
        selectedCharacters: state.selectedCharacters,
        userParticipation: state.userParticipation,
        aiAssistant: state.aiAssistant,
      },
      null,
      2,
    ),
  );

  const participants = [];

  // Ensure selectedCharacters is defined and iterable
  const selectedCharacters = state.selectedCharacters || [];
  console.log(
    "🔍 selectedCharacters in initializeSession:",
    selectedCharacters,
  );

  // Add selected characters
  for (const charId of selectedCharacters) {
    const character = CHARACTER_PROFILES[charId];
    if (character) {
      participants.push({
        name: character.name,
        role: character.role,
        avatar: character.avatar,
        type: "character" as const,
        color: character.color,
      });
    } else {
      console.log(`⚠️ Character not found: ${charId}`);
    }
  }

  // Add user if participating
  if (state.userParticipation) {
    participants.push({
      name: state.userName,
      role: state.userRole,
      avatar: "/src/images/person.png",
      type: "user" as const,
      color: "orange",
    });
  }

  // Add AI assistant if enabled
  if (state.aiAssistant) {
    participants.push({
      name: "AI Assistant",
      role: "Facilitator",
      avatar: "/src/images/robot.png",
      type: "ai" as const,
      color: "purple",
    });
  }

  return {
    participants,
    discussion: [],
    stickyNotes: [],
    keyTakeaways: [],
    participantStats: [],
    currentSpeaker: 0,
    exchangeCount: 0,
    nonAiTurnCount: 0,
    votingPhase: false,
    analysisPhase: false,
    isComplete: false,
  };
}

///////////////////////////////////////////////////////////////////////////
// Create consolidated character-based workflow
///////////////////////////////////////////////////////////////////////////
function createStreamingLangGraphWorkflow(sessionId: number) {
  // Initialize Session and Participants (merged node)
  const initializeSessionAndParticipants = async (
    state: BrainstormStateType,
  ): Promise<Partial<BrainstormStateType>> => {
    console.log(
      `🚀 Initializing session and participants for session ${sessionId}`,
    );

    const result = await initializeSession(state);
    emitUpdate(sessionId, "participants", result.participants);
    emitUpdate(sessionId, "status", {
      phase: "brainstorming",
      message: "Starting character-based brainstorm...",
    });

    return result;
  };

  // Router node to determine next speaker
  const determineNextSpeaker = async (
    state: BrainstormStateType,
  ): Promise<Partial<BrainstormStateType>> => {
    const nonAiParticipants = state.participants.filter((p) => p.type !== "ai");
    const maxNonAiTurns = Math.min(3 * nonAiParticipants.length, 40);

    console.log(
      `🔄 Turn check: ${state.nonAiTurnCount || 0}/${maxNonAiTurns} non-AI turns (${nonAiParticipants.length} non-AI participants)`,
    );

    // Check if discussion phase is complete based on non-AI participant turns
    if ((state.nonAiTurnCount || 0) >= maxNonAiTurns) {
      console.log("🗳️ Discussion complete, transitioning to voting phase");
      return { votingPhase: true };
    }

    // Advance to next speaker in rotation
    const nextSpeakerIndex =
      state.currentSpeaker % (state.participants || []).length;
    const nextParticipant = (state.participants || [])[nextSpeakerIndex];

    console.log(
      `🗣️ Next speaker: ${nextParticipant?.name} (index: ${nextSpeakerIndex}, type: ${nextParticipant?.type})`,
    );

    if (nextParticipant) {
      emitUpdate(sessionId, "status", {
        phase: "brainstorming",
        message: `${nextParticipant.name}'s turn to contribute ideas...`,
      });

      emitUpdate(sessionId, "currentSpeaker", {
        name: nextParticipant.name,
        type: nextParticipant.type,
        isUser: nextParticipant.type === "user",
      });
    }

    return { currentSpeaker: nextSpeakerIndex };
  };

  // Helper function to calculate participant statistics
  function calculateParticipantStats(state: BrainstormStateType) {
    return (state.participants || [])
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
  }

  // Helper function to create sticky note object
  function createStickyNoteObject(
    note: any,
    agent: any,
    state: BrainstormStateType,
  ) {
    return {
      id: `${agent.name.toLowerCase().replace(" ", "-")}-${Date.now()}-${Math.random()}`,
      author: agent.name,
      avatar: agent.avatar,
      content: note.content,
      timestamp: new Date().toISOString(),
      votes: 0,
      votedBy: [] as string[],
      pros: [] as string[],
      cons: [] as string[],
      hasAnalysis: false,
      color: getCharacterColor(agent.name, state.selectedCharacters || []),
    };
  }

  // Generic character node creator with integrated analysis
  function createCharacterNode(characterName: string) {
    return async (
      state: BrainstormStateType,
    ): Promise<Partial<BrainstormStateType>> => {
      const agent = agents.find((a) => a.name === characterName);
      if (!agent) {
        console.log(`⚠️ Agent not found: ${characterName}`);
        return {
          currentSpeaker: state.currentSpeaker + 1,
          exchangeCount: state.exchangeCount + 1,
        };
      }

      try {
        console.log(`🗣️ Getting response from ${characterName}`);

        // 1. Generate character response
        const response = await agent.respond({
          topic: state.topic,
          participants: state.participants || [],
          discussion: state.discussion || [],
          stickyNotes: state.stickyNotes || [],
          exchangeCount: state.exchangeCount || 0,
        });

        // 2. Create discussion message with activity stats
        const stickyNotesAdded = response.stickyNotes
          ? response.stickyNotes.length
          : 0;
        const prosConsAdded = response.prosandcons
          ? response.prosandcons.reduce(
              (total, analysis) =>
                total + analysis.pros.length + analysis.cons.length,
              0,
            )
          : 0;

        const message = {
          speaker: agent.name,
          message: response.message,
          avatar: agent.avatar,
          type:
            (state.participants || []).find((p) => p.name === agent.name)
              ?.type || "character",
          stickyNotesAdded,
          prosConsAdded,
        };

        const updatedDiscussion = [...(state.discussion || []), message];
        emitUpdate(sessionId, "discussion", message);

        // 3. Process sticky notes with immediate analysis
        let updatedStickyNotes = [...(state.stickyNotes || [])];
        if (response.stickyNotes && response.stickyNotes.length > 0) {
          for (const note of response.stickyNotes) {
            const stickyNote = createStickyNoteObject(note, agent, state);
            updatedStickyNotes.push(stickyNote);
            emitUpdate(sessionId, "stickyNote", stickyNote);
          }
        }

        // 4. Process pros and cons
        if (response.prosandcons && response.prosandcons.length > 0) {
          for (const analysis of response.prosandcons) {
            const note = updatedStickyNotes.find(
              (n) => n.id === analysis.stickyNoteId,
            );
            if (note) {
              note.hasAnalysis = true;
              // add pros to existing pros
              note.pros = [...note.pros, ...analysis.pros];
              // add cons to existing cons
              note.cons = [...note.cons, ...analysis.cons];

              // Emit updated sticky note with pros/cons to frontend
              emitUpdate(sessionId, "stickyNoteUpdate", note);
            }
          }
        }

        console.log(`✅ ${characterName}: ${response.message}`);

        // 5. Calculate and update participant statistics
        const updatedState = {
          ...state,
          discussion: updatedDiscussion,
          stickyNotes: updatedStickyNotes,
          currentSpeaker: state.currentSpeaker + 1,
          exchangeCount: (state.exchangeCount || 0) + 1,
        };

        const participantStats = calculateParticipantStats(updatedState);
        emitUpdate(sessionId, "participantStats", participantStats);

        // 6. Return updated state
        const isNonAiParticipant = characterName !== "AI Assistant";
        return {
          discussion: updatedDiscussion,
          stickyNotes: updatedStickyNotes,
          currentSpeaker: state.currentSpeaker + 1,
          exchangeCount: (state.exchangeCount || 0) + 1,
          nonAiTurnCount: isNonAiParticipant
            ? (state.nonAiTurnCount || 0) + 1
            : state.nonAiTurnCount || 0,
          participantStats: participantStats,
        };
      } catch (error) {
        console.log(`⚠️ Error with agent ${characterName}:`, error);
        const isNonAiParticipant = characterName !== "AI Assistant";
        return {
          currentSpeaker: state.currentSpeaker + 1,
          exchangeCount: (state.exchangeCount || 0) + 1,
          nonAiTurnCount: isNonAiParticipant
            ? (state.nonAiTurnCount || 0) + 1
            : state.nonAiTurnCount || 0,
        };
      }
    };
  }

  // User Input node with integrated analysis
  const handleUserInput = async (
    state: BrainstormStateType,
  ): Promise<Partial<BrainstormStateType>> => {
    const userName = state.userName || "Guest";
    console.log(`⏳ Waiting for user input from ${userName}`);

    const userInput = await waitForUserInput(sessionId);
    let updatedDiscussion = [...(state.discussion || [])];
    let updatedStickyNotes = [...(state.stickyNotes || [])];

    // Process user message
    if (userInput.message) {
      const message = {
        speaker: userName,
        message: userInput.message,
        avatar: "/images/person.png",
        type: "user" as const,
      };
      updatedDiscussion.push(message);
      emitUpdate(sessionId, "discussion", message);

      // Auto-convert short messages (≤50 chars) to sticky notes if no explicit sticky notes provided
      if (
        userInput.message.length <= 50 &&
        (!userInput.stickyNotes || userInput.stickyNotes.length === 0)
      ) {
        console.log(
          `📝 Auto-converting short message "${userInput.message}" to sticky note`,
        );
        const autoStickyNote = {
          id: `user-${Date.now()}-auto`,
          author: userName,
          avatar: "/images/person.png",
          content: userInput.message,
          timestamp: new Date().toISOString(),
          votes: 0,
          votedBy: [] as string[],
          pros: [] as string[],
          cons: [] as string[],
          hasAnalysis: false,
          color: "orange",
        };
        updatedStickyNotes.push(autoStickyNote);
        emitUpdate(sessionId, "stickyNote", autoStickyNote);
      }
    }

    // Process user sticky notes with analysis
    if (userInput.stickyNotes) {
      for (let index = 0; index < userInput.stickyNotes.length; index++) {
        const noteContent = userInput.stickyNotes[index];
        const stickyNote = {
          id: `user-${Date.now()}-${index}`,
          author: userName,
          avatar: "/images/person.png",
          content: noteContent,
          timestamp: new Date().toISOString(),
          votes: 0,
          votedBy: [] as string[],
          pros: [] as string[],
          cons: [] as string[],
          hasAnalysis: false,
          color: "orange",
        };

        updatedStickyNotes.push(stickyNote);
        emitUpdate(sessionId, "stickyNote", stickyNote);
      }
    }

    // Calculate and update participant statistics
    const updatedState = {
      ...state,
      discussion: updatedDiscussion,
      stickyNotes: updatedStickyNotes,
      currentSpeaker: state.currentSpeaker + 1,
      exchangeCount: (state.exchangeCount || 0) + 1,
    };

    const participantStats = calculateParticipantStats(updatedState);
    emitUpdate(sessionId, "participantStats", participantStats);

    return {
      discussion: updatedDiscussion,
      stickyNotes: updatedStickyNotes,
      currentSpeaker: state.currentSpeaker + 1,
      exchangeCount: (state.exchangeCount || 0) + 1,
      nonAiTurnCount: (state.nonAiTurnCount || 0) + 1, // User is always non-AI
      participantStats: participantStats,
    };
  };

  // Router function to determine next destination
  function routeToSpeaker(state: BrainstormStateType): string {
    // Check if voting phase should start (this should match determineNextSpeaker logic)
    if (state.votingPhase) {
      return "voting";
    }

    // Route to current speaker
    const currentParticipant = (state.participants || [])[
      state.currentSpeaker % (state.participants || []).length
    ];
    if (!currentParticipant) return "complete";

    if (currentParticipant.type === "user") return "User Input";
    return currentParticipant.name; // Route to specific character
  }

  // Consolidated Voting Node - Handles complete voting process
  const handleCompleteVotingPhase = async (
    state: BrainstormStateType,
  ): Promise<Partial<BrainstormStateType>> => {
    console.log(
      `🗳️ Starting consolidated voting phase for session ${sessionId}`,
    );

    if (!state.stickyNotes || state.stickyNotes.length === 0) {
      console.log("No sticky notes to vote on, skipping voting phase");
      return { votingPhase: false };
    }

    emitUpdate(sessionId, "status", {
      phase: "voting",
      message: "Time to vote on the best ideas!",
    });
    console.log(
      `🗳️ Starting voting phase with ${state.stickyNotes.length} sticky notes`,
    );

    // Get all voting participants (character agents + user if participating)
    const votingParticipants = [];

    // Add character agents
    for (const charId of state.selectedCharacters || []) {
      const agent = agents.find((a) => {
        if (charId === "michael") return a.name === "Michael Scott";
        if (charId === "dwight") return a.name === "Dwight Schrute";
        if (charId === "jim") return a.name === "Jim Halpert";
        if (charId === "pam") return a.name === "Pam Beesly";
        if (charId === "kevin") return a.name === "Kevin Malone";
        if (charId === "karen") return a.name === "Karen Filippelli";
        if (charId === "jan") return a.name === "Jan Levinson";
        if (charId === "erin") return a.name === "Erin Hannon";
        return false;
      });
      if (agent) votingParticipants.push(agent);
    }

    // Add user to voting if participating (but exclude AI Assistant from voting)
    if (state.userParticipation) {
      votingParticipants.push({
        name: state.userName || "Guest",
        avatar: "/src/images/person.png",
        description: "User participant",
        respond: async () => ({
          action: "comment",
          message: "",
          stickyNotes: [],
        }),
        vote: async () => ({ message: "", votes: [], reasoning: "" }),
      });
    }

    console.log(
      `🗳️ Voting participants: ${votingParticipants.map((p) => p.name).join(", ")}`,
    );

    const votingRationale: Array<{ speaker: string; reasoning: string }> = [];
    let updatedStickyNotes = [...(state.stickyNotes || [])];
    let updatedDiscussion = [...(state.discussion || [])];

    // Each participant votes using clean agent interface
    for (const participant of votingParticipants) {
      emitUpdate(sessionId, "status", {
        phase: "voting",
        message: `${participant.name} is voting...`,
      });

      if (participant.name === state.userName) {
        // Set current speaker to user for voting UI
        emitUpdate(sessionId, "currentSpeaker", {
          name: participant.name,
          type: "user",
          isUser: true,
        });

        // Wait for user votes
        console.log(`⏳ Waiting for user votes from ${participant.name}`);
        const userVotes = await waitForUserInput(sessionId);

        if (userVotes.selectedNotes && userVotes.selectedNotes.length > 0) {
          // Process user votes
          userVotes.selectedNotes.forEach((noteId: string) => {
            const note = updatedStickyNotes.find((n) => n.id === noteId);
            if (note && !note.votedBy.includes(participant.name)) {
              note.votes += 1;
              note.votedBy.push(participant.name);
            }
          });

          // Add voting explanation to discussion
          const votingMessage = {
            speaker: participant.name,
            message: `💭 Voting rationale: ${userVotes.reasoning || "No explanation provided."}`,
            avatar: "/images/person.png",
            type: "user" as const,
          };
          updatedDiscussion.push(votingMessage);
          emitUpdate(sessionId, "discussion", votingMessage);

          if (userVotes.reasoning) {
            votingRationale.push({
              speaker: participant.name,
              reasoning: userVotes.reasoning,
            });
          }

          console.log(
            `✅ ${participant.name} voted for ${userVotes.selectedNotes.length} notes`,
          );
        }
      } else {
        // Agent voting
        try {
          console.log(`🗳️ Getting votes from ${participant.name}`);
          const voteResponse = await participant.vote(
            updatedStickyNotes.map((note) => ({
              id: note.id,
              content: note.content,
              author: note.author,
              votes: note.votes,
              votedBy: note.votedBy,
            })),
            {
              topic: state.topic,
              participants: state.participants || [],
              discussion: updatedDiscussion,
              stickyNotes: updatedStickyNotes,
              exchangeCount: state.exchangeCount || 0,
            },
          );

          // Process agent votes (convert 1-based indices to 0-based)
          voteResponse.votes.forEach((oneBasedIndex) => {
            const zeroBasedIndex = oneBasedIndex - 1; // Convert 1-based to 0-based
            if (
              zeroBasedIndex >= 0 &&
              zeroBasedIndex < updatedStickyNotes.length
            ) {
              const note = updatedStickyNotes[zeroBasedIndex];
              if (!note.votedBy.includes(participant.name)) {
                note.votes += 1;
                note.votedBy.push(participant.name);
              }
            }
          });

          // Add voting explanation to discussion
          const votingMessage = {
            speaker: participant.name,
            message: `💭 Voting rationale: ${voteResponse.reasoning}`,
            avatar: participant.avatar,
            type: "character" as const,
          };
          updatedDiscussion.push(votingMessage);
          emitUpdate(sessionId, "discussion", votingMessage);

          votingRationale.push({
            speaker: participant.name,
            reasoning: voteResponse.reasoning,
          });

          console.log(
            `✅ ${participant.name} voted with reasoning: ${voteResponse.reasoning}`,
          );
        } catch (error) {
          console.log(`⚠️ Voting error for ${participant.name}:`, error);
        }
      }

      // Emit updated sticky notes
      emitUpdate(sessionId, "stickyNotes", updatedStickyNotes);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return {
      discussion: updatedDiscussion,
      stickyNotes: updatedStickyNotes,
      votingResults: votingRationale,
      votingPhase: false,
    };
  };

  // Consolidated Completion Node - Generate final results and analytics
  const generateSummaryAndComplete = async (
    state: BrainstormStateType,
  ): Promise<Partial<BrainstormStateType>> => {
    console.log(`🏁 Starting completion phase for session ${sessionId}`);

    emitUpdate(sessionId, "status", {
      phase: "finalizing",
      message: "Generating final results...",
    });

    // Calculate participant statistics first
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

    // Generate key takeaways using AI analysis
    let keyTakeaways: string[] = [];
    try {
      console.log("🧠 Generating key takeaways with AI analysis...");
      const takeawaysResult = await keyTakeawaysAgent.generateKeyTakeaways({
        topic: state.topic,
        discussion: state.discussion || [],
        votingRationale: state.votingResults || [],
        participantStats: participantStats,
        stickyNotes: state.stickyNotes || [],
      });
      keyTakeaways = takeawaysResult.keyTakeaways;
      console.log(`✅ Generated ${keyTakeaways.length} key takeaways`);
    } catch (error) {
      console.log("⚠️ Key takeaways generation failed:", error);
      keyTakeaways = [
        "Discussion generated valuable insights through character perspectives",
        "Voting process revealed community preferences for practical solutions",
        "Collaborative brainstorming produced diverse and creative ideas",
      ];
    }

    // Emit final updates
    emitUpdate(sessionId, "keyTakeaways", keyTakeaways);
    emitUpdate(sessionId, "participantStats", participantStats);

    // Create final results object
    const results: BrainstormResults = {
      topic: state.topic,
      participants: state.participants || [],
      discussion: state.discussion || [],
      stickyNotes: state.stickyNotes || [],
      keyTakeaways: keyTakeaways,
      participantStats: participantStats,
    };

    emitUpdate(sessionId, "complete", results);

    console.log("✅ Completion phase finished successfully!");

    return {
      keyTakeaways: keyTakeaways,
      participantStats: participantStats,
      isComplete: true,
    };
  };

  ///////////////////////////////////////////////////////////////////////////
  // LangGraph Workflow Definition
  ///////////////////////////////////////////////////////////////////////////
  const graph = new StateGraph(BrainstormStateAnnotation)
    // Core nodes
    .addNode("initialize", initializeSessionAndParticipants)
    .addNode("nextSpeaker", determineNextSpeaker)

    // Character nodes with integrated analysis
    .addNode("Michael Scott", createCharacterNode("Michael Scott"))
    .addNode("Dwight Schrute", createCharacterNode("Dwight Schrute"))
    .addNode("Jim Halpert", createCharacterNode("Jim Halpert"))
    .addNode("Pam Beesly", createCharacterNode("Pam Beesly"))
    .addNode("Kevin Malone", createCharacterNode("Kevin Malone"))
    .addNode("Karen Filippelli", createCharacterNode("Karen Filippelli"))
    .addNode("Jan Levinson", createCharacterNode("Jan Levinson"))
    .addNode("Erin Hannon", createCharacterNode("Erin Hannon"))
    .addNode("User Input", handleUserInput)
    .addNode("AI Assistant", createCharacterNode("AI Assistant"))

    // Phase nodes
    .addNode("voting", handleCompleteVotingPhase)
    .addNode("complete", generateSummaryAndComplete)

    // Flow edges
    .addEdge(START, "initialize")
    .addEdge("initialize", "nextSpeaker")

    // Dynamic character routing
    .addConditionalEdges("nextSpeaker", routeToSpeaker, {
      "Michael Scott": "Michael Scott",
      "Dwight Schrute": "Dwight Schrute",
      "Jim Halpert": "Jim Halpert",
      "Pam Beesly": "Pam Beesly",
      "Kevin Malone": "Kevin Malone",
      "Karen Filippelli": "Karen Filippelli",
      "Jan Levinson": "Jan Levinson",
      "Erin Hannon": "Erin Hannon",
      "User Input": "User Input",
      "AI Assistant": "AI Assistant",
      voting: "voting",
      complete: "complete",
    })

    // Character nodes flow back to router
    .addEdge("Michael Scott", "nextSpeaker")
    .addEdge("Dwight Schrute", "nextSpeaker")
    .addEdge("Jim Halpert", "nextSpeaker")
    .addEdge("Pam Beesly", "nextSpeaker")
    .addEdge("Kevin Malone", "nextSpeaker")
    .addEdge("Karen Filippelli", "nextSpeaker")
    .addEdge("Jan Levinson", "nextSpeaker")
    .addEdge("Erin Hannon", "nextSpeaker")
    .addEdge("User Input", "nextSpeaker")
    .addEdge("AI Assistant", "nextSpeaker")

    // Voting and completion flow
    .addEdge("voting", "complete")
    .addEdge("complete", END);

  return graph.compile();
}

///////////////////////////////////////////////////////////////////////////
// Main workflow execution
///////////////////////////////////////////////////////////////////////////
export async function generateBrainstormWithStreaming(sessionData: {
  sessionId: number;
  topic: string;
  selectedCharacters: string[];
  aiAssistant: boolean;
  userParticipation: boolean;
  userName?: string;
  userRole?: string;
}): Promise<BrainstormResults> {
  const sessionId = sessionData.sessionId;
  console.log(`🚀 Starting LangGraph workflow for session ${sessionId}`);
  console.log(`🔍 Session data:`, JSON.stringify(sessionData, null, 2));

  // Create and execute the LangGraph workflow
  const workflow = createStreamingLangGraphWorkflow(sessionId);

  // Prepare initial state
  const initialState = {
    topic: sessionData.topic,
    selectedCharacters: sessionData.selectedCharacters,
    aiAssistant: sessionData.aiAssistant,
    userParticipation: sessionData.userParticipation,
    userName: sessionData.userName || "Guest",
    userRole: sessionData.userRole || "Participant",
    participants: [],
    discussion: [],
    stickyNotes: [],
    keyTakeaways: [],
    participantStats: [],
    currentSpeaker: 0,
    exchangeCount: 0,
    nonAiTurnCount: 0,
    votingPhase: false,
    votingResults: [],
    isComplete: false,
  };

  // Execute the LangGraph workflow with increased recursion limit
  const finalState = await workflow.invoke(initialState, {
    recursionLimit: 50,
  });

  // Extract results from final state
  const results: BrainstormResults = {
    topic: finalState.topic,
    participants: finalState.participants || [],
    discussion: finalState.discussion || [],
    stickyNotes: finalState.stickyNotes || [],
    keyTakeaways: finalState.keyTakeaways || [],
    participantStats: finalState.participantStats || [],
  };

  return results;
}
