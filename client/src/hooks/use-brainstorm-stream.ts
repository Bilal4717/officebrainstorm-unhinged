import { useEffect, useRef, useState } from 'react';
import type { BrainstormResults } from '@shared/schema';

interface StreamingUpdate {
  type: string;
  data: any;
  timestamp: string;
}

interface StreamingState {
  status: {
    phase: string;
    message: string;
  };
  participants: BrainstormResults['participants'];
  discussion: BrainstormResults['discussion'];
  stickyNotes: BrainstormResults['stickyNotes'];
  keyTakeaways: BrainstormResults['keyTakeaways'];
  participantStats: BrainstormResults['participantStats'];
  votingUpdate?: {
    participantsWhoVoted: string[];
    totalParticipants: number;
  };
  analysis?: {
    analyzedCount: number;
    totalCount: number;
  };
  currentSpeaker?: {
    name: string;
    type: string;
    isUser: boolean;
  };
  isComplete: boolean;
  error?: string;
}

export function useBrainstormStream(sessionId: number | null) {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    status: { phase: 'waiting', message: 'Preparing to start...' },
    participants: [],
    discussion: [],
    stickyNotes: [],
    keyTakeaways: [],
    participantStats: [],
    isComplete: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    console.log(`Connecting to stream for session ${sessionId}`);

    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource(`/api/brainstorm/${sessionId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const update: StreamingUpdate = JSON.parse(event.data);
        console.log('Received update:', update.type, update.data);

        setStreamingState((prev) => {
          const newState = { ...prev };

          switch (update.type) {
            case 'connected':
              console.log('Successfully connected to stream');
              break;

            case 'status':
              newState.status = update.data;
              break;

            case 'participants':
              newState.participants = update.data;
              break;

            case 'discussion':
              // Add new discussion message
              newState.discussion = [...prev.discussion, update.data];
              break;

            case 'stickyNote':
              // Add new sticky note
              newState.stickyNotes = [...prev.stickyNotes, update.data];
              break;

            case 'stickyNotes':
              // Update entire sticky notes array (used for voting updates)
              newState.stickyNotes = update.data;
              break;

            case 'stickyNoteUpdate':
              // Update existing sticky note with analysis (pros/cons)
              newState.stickyNotes = prev.stickyNotes.map(note => 
                note.id === update.data.id ? update.data : note
              );
              break;

            case 'stickyNoteAnalysis':
              // Update sticky note with live analysis results
              newState.stickyNotes = prev.stickyNotes.map(note => 
                note.id === update.data.id 
                  ? { ...note, pros: update.data.pros, cons: update.data.cons, hasAnalysis: update.data.hasAnalysis }
                  : note
              );
              break;

            case 'votingUpdate':
              newState.votingUpdate = update.data;
              break;

            case 'analysis':
              newState.analysis = update.data;
              break;

            case 'keyTakeaways':
              newState.keyTakeaways = update.data;
              break;



            case 'participantStats':
              newState.participantStats = update.data;
              break;

            case 'currentSpeaker':
              newState.currentSpeaker = update.data;
              break;

            case 'complete':
              newState.isComplete = true;
              newState.status = { phase: 'complete', message: 'Brainstorm session completed!' };
              // Update all final data
              if (update.data.keyTakeaways) newState.keyTakeaways = update.data.keyTakeaways;

              if (update.data.participantStats) newState.participantStats = update.data.participantStats;
              break;

            case 'error':
              newState.error = update.data.message;
              newState.status = { phase: 'error', message: `Error: ${update.data.message}` };
              break;

            default:
              console.log('Unknown update type:', update.type);
          }

          return newState;
        });
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setStreamingState((prev) => ({
        ...prev,
        error: 'Connection to brainstorm stream was lost',
        status: { phase: 'error', message: 'Connection lost - please refresh to retry' }
      }));
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [sessionId]);

  // Function to manually close the stream
  const closeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // User interaction functions
  const submitUserMessage = async (message: string, stickyNotes: string[]) => {
    try {
      const response = await fetch(`/api/brainstorm/${sessionId}/user-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, stickyNotes })
      });
      if (!response.ok) {
        throw new Error('Failed to submit user message');
      }
    } catch (error) {
      console.error('Error submitting user message:', error);
      throw error;
    }
  };

  const submitUserVote = async (selectedNotes: string[], reasoning?: string) => {
    try {
      const response = await fetch(`/api/brainstorm/${sessionId}/user-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedNotes, reasoning })
      });
      if (!response.ok) {
        throw new Error('Failed to submit user vote');
      }
    } catch (error) {
      console.error('Error submitting user vote:', error);
      throw error;
    }
  };

  const skipUserTurn = async () => {
    try {
      const response = await fetch(`/api/brainstorm/${sessionId}/skip-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to skip user turn');
      }
    } catch (error) {
      console.error('Error skipping user turn:', error);
      throw error;
    }
  };

  return {
    ...streamingState,
    closeStream,
    submitUserMessage,
    submitUserVote,
    skipUserTurn
  };
}