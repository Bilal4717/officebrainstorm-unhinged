# The Office Brainstorm - Replit.md

## Overview

The Office Brainstorm is a themed web application that creates AI-powered brainstorming sessions featuring characters from "The Office" TV show. Users can select characters, define a topic, and watch as AI generates a simulated brainstorming discussion between these characters. The application uses modern web technologies with a React frontend, Express backend, and AI integration through OpenAI's GPT models.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom "Office" theme variables
- **State Management**: React Hook Form for form handling, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with structured responses

## Key Components

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL adapter for cloud deployment
- **Schema**: Single table for brainstorm sessions with JSONB for results storage
- **Storage Pattern**: Interface-based storage with memory fallback for development

### Authentication & Sessions
- Currently uses in-memory session storage
- Prepared for PostgreSQL session storage with connect-pg-simple
- No user authentication system implemented yet

### AI Integration
- **Provider**: Groq Cloud with Llama-3.3-70b-versatile model
- **Framework**: LangChain for LLM orchestration and prompt management
- **Workflow Engine**: LangGraph for multi-agent conversation orchestration
- **Character Profiles**: Predefined personality traits and catchphrases for Office characters
- **LangGraph Workflow Architecture**:
  - **State Management**: Annotation-based state tracking for participants, discussion, and metadata
  - **Node Functions**: 
    - `initializeSession`: Sets up participants and initial conversation state
    - `generateResponse`: Context-aware character response generation using PromptTemplate
    - `generateSummary`: Automated key takeaway extraction from full discussion
  - **Conditional Edges**: Dynamic workflow routing based on conversation length
  - **Message History**: Full conversation tracking with BaseMessage chains
- **Multi-Agent System**: Each Office character acts as an independent agent with distinct personality prompts
- **Context Awareness**: Previous discussion context influences each response for natural conversation flow
- **Monitoring**: LangFuse integration for workflow observability (configured but not active)

### UI Components
- Comprehensive component library built on Radix UI primitives
- Custom character selection cards with avatar support
- Form validation using Zod schemas
- Toast notifications for user feedback
- Loading states and error handling

## Data Flow

1. **Session Creation**: User selects characters, topic, and options on home page
2. **Form Validation**: Client-side validation using Zod schemas before submission
3. **API Request**: POST to `/api/brainstorm` endpoint with session data
4. **AI Generation**: Server calls OpenAI API to generate character discussions
5. **Data Storage**: Session and results stored in database/memory
6. **Results Display**: User redirected to results page showing generated brainstorm
7. **Session Retrieval**: GET request to fetch and display existing sessions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for production
- **drizzle-orm** & **drizzle-kit**: Database ORM and migration tools
- **openai**: Official OpenAI API client
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers**: Zod integration for form validation

### UI Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and developer experience
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` directory using Vite
- Backend bundles to `dist/index.js` using esbuild
- Single build command handles both frontend and backend

### Environment Configuration
- Development: Uses tsx for TypeScript execution with hot reload
- Production: Compiled JavaScript with NODE_ENV=production
- Database: Requires DATABASE_URL environment variable for PostgreSQL
- AI: Requires OPENAI_API_KEY for GPT integration

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database (Neon serverless recommended)
- Environment variables for database and OpenAI API access
- Static file serving for frontend assets

## Changelog

- July 05, 2025. Initial setup
- July 05, 2025. Added real-time streaming functionality with Server-Sent Events:
  - Implemented live brainstorm session updates showing results as they arrive
  - Created streaming workflow with real-time participant tracking
  - Added live progress indicators and phase-based status updates
  - Built comprehensive streaming page with participant statistics and pros/cons analysis
  - Replaced static results page with dynamic streaming experience
- July 05, 2025. Implemented user participation feature:
  - Added user name and role fields to brainstorm creation form
  - Created UserParticipation component for real-time user interaction
  - Built user interface for contributing messages, sticky notes, and voting
  - Added current speaker tracking and turn-based interaction system
  - Implemented backend endpoints for user message submission and voting
  - Enhanced streaming workflow to emit current speaker information
- July 05, 2025. Enhanced character behaviors and voting system:
  - Characters can now skip turns, comment without sticky notes, or contribute both
  - Added character-specific voting explanations based on personality and relationships
  - Made voting mandatory for all participants during voting phase
  - Characters explain their vote choices considering personal preferences and relationships with other participants
  - Participants can now vote for their own ideas to support their contributions
- July 05, 2025. Implemented AI Assistant feature:
  - Added AI assistant toggle option to brainstorm creation form
  - Created dedicated AI facilitator using Groq compound-beta-mini model
  - AI assistant encourages participation without proposing ideas, adding sticky notes, or voting
  - Provides contextual prompts like "any stickies to add about accounting?" based on participant roles
  - Appears in live discussion thread with robot emoji avatar
  - Excluded from voting phase to maintain neutrality
  - Enhanced analysis system to better detect specific negative sentiment patterns
- July 05, 2025. Restructured with LangGraph Agent Architecture:
  - Implemented proper agent interfaces with JSON validation for all agent responses
  - Created CharacterAgent, AIAssistantAgent, VotingAgent, and AnalysisAgent classes
  - Defined structured output interfaces: CharacterResponseOutput, AIAssistantOutput, VotingOutput, AnalysisOutput
  - Centralized agent management through AgentManager class for consistent agent handling
  - Each agent has dedicated response parsing with fallback mechanisms for robustness
  - Updated workflow functions to use agent-based responses instead of template-based prompts
  - Improved error handling and validation through structured agent interfaces
- July 05, 2025. Implemented Unified Agent Interface System:
  - Defined core BrainstormAgent interface with respond() and vote() methods
  - Created AgentRegistry system for testable and interchangeable agent management
  - Implemented createAgentNode() pattern enabling graph.addNode("Michael", agents["michael"].respond())
  - CharacterAgent and AIAssistantAgent now implement BrainstormAgent interface
  - AgentRegistry provides getAgent() method for name-based agent lookup
  - Enables plug-and-play coordination with decoupled routing for scalability
- July 05, 2025. Completed Clean Agent Architecture:
  - Exported proper BrainstormAgent interface with TypeScript types
  - Implemented class-based agents (MichaelAgent, DwightAgent, JimAgent, AIAssistantAgent)
  - Added Zod schema validation for CharacterResponse and VotingResponse
  - Created agents array for direct LangGraph integration: agents.forEach(agent => graph.addNode(agent.name, agent.respond))
  - Clean separation of agent logic from workflow orchestration in brainstorm-agents.ts
- July 05, 2025. Implemented Multi-Agent Conversation System:
  - Successfully created 3-round conversation system with proper turn-taking
  - Fixed character ID matching to connect "jim"/"dwight" to "Jim Halpert"/"Dwight Schrute" agents
  - Removed 80% of legacy LangGraph code, simplified to direct agent.respond(state) calls
  - Real-time streaming of individual agent responses with distinct personalities
  - Debug logging confirms proper agent selection and conversation flow execution
- July 05, 2025. Redeveloped Voting Phase with Clean Agent Architecture:
  - Restructured voting system to use consistent agent.vote(stickyNotes, state) interface
  - Separated voting participants from conversation participants for better control
  - Excluded AI Assistant from voting while keeping character agents and user participation
  - Character-authentic vote reasoning demonstrates proper personality integration
  - Real-time vote updates with proper sticky note state management
  - Added voting rationale display in discussion thread with 💭 prefix for transparency
  - Both agent and user voting explanations appear as discussion messages for full visibility
- July 05, 2025. Implemented Live AI Analysis Feature with Clean Agent Architecture:
  - Created LiveAnalysisAgent class using AnalysisAgent interface for consistent architecture
  - Real-time pros/cons analysis of sticky notes as they're created during conversation
  - Streaming analysis results via stickyNoteAnalysis events for immediate frontend updates
  - Error-resilient JSON parsing with fallback analysis when LLM output fails
  - Each sticky note gets 2-3 pros and 2-3 cons providing balanced evaluation of ideas
  - Analysis now includes discussion context to summarize what characters actually said about each sticky note
  - Pros and cons reflect participant feedback rather than generic AI evaluation
- July 05, 2025. Redeveloped Key Takeaways Agent with Clean Architecture:
  - Created SummaryAgent interface following consistent agent pattern (analyze, vote, generateKeyTakeaways)
  - KeyTakeawaysAgent analyzes top 3 winning ideas with discussion context and voting rationale
  - Generates intelligent insights explaining why winning ideas were chosen based on character discussions
  - Real-time streaming of key takeaways results with error-resilient JSON parsing
  - Enhanced participant statistics to show actual vote counts and averages per sticky note
  - Improved KeyTakeaways agent to generate specific, character-authentic insights rather than generic fallback text
  - Uses more capable LLM model (llama-3.3-70b-versatile) with simplified prompts for better JSON consistency
  - References actual winning ideas, participant quotes, and voting explanations in generated takeaways
- July 05, 2025. Implemented Three-Node LangGraph Architecture:
  - Refactored workflow into three modular LangGraph nodes: discussion_facilitation, vote_facilitation, and completion
  - Discussion facilitation node handles entire conversation phase with participant setup and turn-based agent responses
  - Vote facilitation node manages complete voting process for all participants with real-time rationale streaming
  - Completion node determines top ideas based on votes and generates final results with AI analysis
  - Replaced manual turn-based system with proper LangGraph workflow orchestration
  - Clean phase transitions: START → discussion_facilitation → vote_facilitation → completion → END
  - Each node encapsulates complete functionality for better maintainability and error isolation
  - Moved "determine top ideas based on votes" responsibility to completion node as requested
  - Maintained all existing functionality while improving workflow architecture and modularity
- July 05, 2025. Implemented Consolidated Character-Based LangGraph Architecture:
  - Created individual character nodes: "Michael Scott", "Dwight Schrute", "Jim Halpert", "AI Assistant", "User Input"
  - Each character operates as independent LangGraph node with integrated live analysis
  - Implemented intelligent router (nextSpeaker) for dynamic conversation flow and conditional routing
  - Consolidated nodes: initialize (setup + participants), voting (complete voting process), complete (summary + results)
  - Flow: START → initialize → nextSpeaker → [character nodes] → nextSpeaker → voting → complete → END
  - Live analysis integrated into each character node for immediate pros/cons feedback on sticky notes
  - Router handles phase transitions automatically based on conversation state (6 rounds → voting → completion)
  - Character-specific error handling and graceful fallback for failed agents
  - True multi-agent orchestration with individual character autonomy and proper LangGraph workflow management
- July 06, 2025. Refactored Character Agent Architecture:
  - Replaced individual character classes (MichaelAgent, DwightAgent, JimAgent) with generic CharacterAgent class
  - CharacterAgent now takes parameters: name, avatar, role, personality for maximum reusability
  - Enhanced character personalities with detailed, authentic descriptions including specific behaviors and catchphrases
  - Updated CHARACTER_PROFILES to use enhanced character data from CHARACTERS constant
  - Removed description property from BrainstormAgent interface as requested
  - Removed averageVotesPerNote from state interfaces and UI components for cleaner participant statistics
  - Removed votesReceived from participant statistics display and calculations
  - Participant stats now show only: Ideas Created and Undiscussed Cards (when applicable)
  - All existing functionality maintained while eliminating code duplication and improving maintainability
- July 06, 2025. Completed topIdeas Removal:
  - Removed topIdeas field from BrainstormResults interface and all related state management
  - Updated SummaryAgent interface to remove topIdeas parameter from generateKeyTakeaways method
  - Modified KeyTakeawaysAgent to generate insights based on discussion and voting patterns instead of top ideas
  - Updated frontend components to compute top ideas dynamically from sorted sticky notes when needed
  - Removed all topIdeas references from streaming state management and event handlers
  - Simplified results display to focus on sticky notes, key takeaways, and participant statistics
  - Maintained all existing functionality while reducing system complexity and data duplication
- July 06, 2025. Restored Proper LangGraph Architecture:
  - Fixed critical regression where createStreamingLangGraphWorkflow was not being used
  - Replaced manual imperative loop with proper LangGraph workflow orchestration
  - Updated generateBrainstormWithStreaming to use createStreamingLangGraphWorkflow as the core engine
  - Removed duplicate manual implementation code that was bypassing the LangGraph system
  - Restored proper multi-agent conversation orchestration with state management
  - LangGraph workflow is now the central architecture for all brainstorm session management
  - Maintains all streaming functionality while using proper workflow patterns
  - Removed unused shouldContinue function (dead code) - current workflow uses routeToSpeaker for conditional routing
  - Fixed character routing error by adding all Office characters (Pam, Stanley, Angela, Kevin, Creed) to agents and LangGraph nodes
  - Updated conditional routing and edges to support all available characters instead of just Michael, Dwight, and Jim
- July 06, 2025. Fixed Character Voting and UI Issues:
  - Resolved voting exclusion bug by adding all Office characters (Pam, Stanley, Angela, Kevin, Creed) to voting participant mapping
  - Fixed voting UI display issue by adding currentSpeaker emission during user voting phase
  - Updated character ID mapping in voting logic to include all selectable characters
  - Fixed TypeScript errors in brainstorm-streaming page related to session data structure
  - System now properly signals when it's user's turn to vote with isUser: true in currentSpeaker events
  - All Office characters can now participate in both discussion and voting phases correctly
  - User voting interface displays properly with checkbox selection for top 3 ideas
  - Successfully tested with Jim and Pam characters showing complete workflow functionality
- July 06, 2025. Updated Character System with Local Images and UI Improvements:
  - Replaced all external avatar URLs with local character images stored in /src/images/ folder
  - Added support for additional characters: Karen Filippelli, Jan Levinson, Erin Hannon (total of 8 characters)
  - Reordered character list alphabetically by first name (Dwight, Erin, Jan, Jim, Karen, Kevin, Michael, Pam)
  - Added personality tooltips on character card hover using shadcn/ui Tooltip component
  - Updated LangGraph workflow to include all new characters with proper node creation and routing
  - Enhanced voting participant mapping to support all 8 characters correctly
  - All character images (michael.png, dwight.png, jim.png, pam.png, kevin.png, karen.png, jan.png, erin.png) now load from local assets
  - Improved user experience with character personality previews available on hover
- July 06, 2025. Fixed Vote Counting System:
  - Resolved critical bug where vote totals were not being recorded correctly
  - Fixed 1-based to 0-based index conversion in voting logic (agents vote for positions 1-N, converted to array indices 0-(N-1))
  - Voting system now accurately tracks which participants voted for which sticky notes
  - Vote counts and votedBy arrays now display correctly in results
  - All 8 characters properly participate in voting phase with accurate vote tallying
- July 06, 2025. Fixed Key Takeaways Vote Analysis and AI Assistant JSON Parsing:
  - Resolved issue where KeyTakeawaysAgent ignored actual vote counts, only using voting rationale text
  - Added stickyNotes data with vote counts to generateKeyTakeaways method for accurate analysis
  - Enhanced prompt to show actual vote tallies sorted by highest votes first
  - Added clear instruction to base takeaways on vote counts, not just discussion content
  - Fixed AI Assistant JSON parsing failures by improving error handling and field validation
  - Added comprehensive JSON cleanup and fallback for AI Assistant responses
  - Key takeaways now accurately reflect the ideas that received the most votes
- July 06, 2025. Fixed User Participation Turn Allocation:
  - Resolved issue where users only got one turn instead of multiple rounds in discussion phase
  - Fixed conflicting routing logic between determineNextSpeaker and routeToSpeaker functions
  - Aligned routeToSpeaker with determineNextSpeaker's 3-turns-per-participant logic
  - Users now get proper turn allocation: 3 turns per non-AI participant before voting phase
  - Simplified routeToSpeaker to focus only on routing, leaving turn counting to determineNextSpeaker
- July 06, 2025. Enhanced User Sticky Note Creation:
  - Added auto-conversion of short user messages (≤50 characters) to sticky notes when no explicit sticky notes provided
  - Improved user experience by automatically creating sticky notes from concise contributions like "chocolate" or "flowers"
  - Users can still use dedicated sticky note fields for multiple ideas, or rely on auto-conversion for single short ideas
  - System now captures user ideas more intuitively without requiring explicit use of sticky note interface
- July 06, 2025. Updated Profile Icons with Local Images:
  - Replaced AI Assistant emoji avatar ("🤖") with local robot.png image from /src/images/robot.png
  - Updated all user avatar assignments from empty string to person.png image from /src/images/person.png
  - Applied consistent avatar usage across all user interactions: messages, sticky notes, voting, and participant display
  - Enhanced visual consistency by using proper image assets instead of fallback text/emoji avatars
- July 06, 2025. Fixed Image Path Issues for Production Deployment:
  - Updated all image paths from /src/images/ to /images/ for proper production serving
  - Copied character images to public/images/ directory for static file serving
  - Fixed character avatars in lib/characters.ts to use correct production paths
  - Updated server-side image references in brainstorm.ts and brainstorm-agents.ts
  - Resolved broken image display in production deployment on Vultr server
- July 06, 2025. Enhanced GitHub Integration and Documentation:
  - Updated README.md with comprehensive deployment instructions for Vultr Cloud Compute
  - Added detailed environment variable configuration and security setup
  - Documented complete API endpoints and architecture overview
  - Created proper GitHub workflow with updated export instructions
  - Enhanced project documentation for open-source contribution

## User Preferences

Preferred communication style: Simple, everyday language.