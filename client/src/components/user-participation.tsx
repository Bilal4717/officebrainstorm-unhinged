import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  StickyNote,
  Vote,
  Check,
  SkipForward,
} from "lucide-react";

interface UserParticipationProps {
  isUserTurn: boolean;
  phase: string;
  userName: string;
  userRole: string;
  onSubmitMessage: (message: string, stickyNotes: string[]) => void;
  onSkipTurn: () => void;
  onVote: (selectedNotes: string[], reasoning?: string) => void;
  availableNotes?: Array<{
    id: string;
    content: string;
    author: string;
  }>;
}

export function UserParticipation({
  isUserTurn,
  phase,
  userName,
  userRole,
  onSubmitMessage,
  onSkipTurn,
  onVote,
  availableNotes = [],
}: UserParticipationProps) {
  const [message, setMessage] = useState("");
  const [stickyNote1, setStickyNote1] = useState("");
  const [stickyNote2, setStickyNote2] = useState("");
  const [stickyNote3, setStickyNote3] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [votingReasoning, setVotingReasoning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitContribution = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    const stickyNotes = [stickyNote1, stickyNote2, stickyNote3].filter(
      (note) => note.trim().length > 0,
    );

    try {
      await onSubmitMessage(message.trim(), stickyNotes);
      // Clear form
      setMessage("");
      setStickyNote1("");
      setStickyNote2("");
      setStickyNote3("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteSubmit = async () => {
    if (selectedNotes.length !== 3) return;

    setIsSubmitting(true);
    try {
      await onVote(selectedNotes, votingReasoning);
      setSelectedNotes([]);
      setVotingReasoning("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) => {
      if (prev.includes(noteId)) {
        return prev.filter((id) => id !== noteId);
      } else if (prev.length < 3) {
        return [...prev, noteId];
      }
      return prev;
    });
  };

  if (!isUserTurn) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center text-gray-600">
            <MessageSquare className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p>Waiting for other participants...</p>
            <p className="text-sm mt-1">It's not your turn yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "voting") {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <Vote className="mr-2 h-5 w-5" />
            Your Turn to Vote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-6">
            {availableNotes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedNotes.includes(note.id)
                    ? "bg-orange-100 border-orange-300"
                    : "bg-white border-gray-200 hover:border-orange-200"
                }`}
                onClick={() => toggleNoteSelection(note.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{note.content}</p>
                    <p className="text-sm text-gray-600">by {note.author}</p>
                  </div>
                  {selectedNotes.includes(note.id) && (
                    <Check className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Voting Reasoning */}

          <div className="flex gap-3">
            <Button
              onClick={handleVoteSubmit}
              disabled={selectedNotes.length !== 3 || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting Votes...
                </>
              ) : (
                <>
                  <Vote className="mr-2 h-4 w-4" />
                  Submit Votes ({selectedNotes.length}/3)
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-orange-600 mt-3 text-center">
            Voting is mandatory - please select exactly 3 ideas to continue.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Brainstorming phase
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <MessageSquare className="mr-2 h-5 w-5" />
          Your Turn to Contribute
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">{userName}</Badge>
          <span className="text-blue-600">{userRole}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discussion Message */}
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Your contribution to the discussion:
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts on the topic..."
            className="min-h-[80px]"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length}/500 characters
          </p>
        </div>

        {/* Sticky Notes */}
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-2 flex items-center">
            <StickyNote className="mr-1 h-4 w-4" />
            Add sticky note ideas (optional, max 50 chars each):
          </label>
          <div className="space-y-2">
            <Input
              value={stickyNote1}
              onChange={(e) => setStickyNote1(e.target.value)}
              placeholder="Idea 1..."
              maxLength={50}
            />
            <Input
              value={stickyNote2}
              onChange={(e) => setStickyNote2(e.target.value)}
              placeholder="Idea 2..."
              maxLength={50}
            />
            <Input
              value={stickyNote3}
              onChange={(e) => setStickyNote3(e.target.value)}
              placeholder="Idea 3..."
              maxLength={50}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmitContribution}
            disabled={!message.trim() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Submit Contribution
              </>
            )}
          </Button>

          <Button
            onClick={onSkipTurn}
            variant="outline"
            disabled={isSubmitting}
          >
            <SkipForward className="mr-2 h-4 w-4" />
            Skip Turn
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
