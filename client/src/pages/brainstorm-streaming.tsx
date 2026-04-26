import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StickyNotesBoard } from "@/components/sticky-notes-board";
import { UserParticipation } from "@/components/user-participation";
import { useBrainstormStream } from "@/hooks/use-brainstorm-stream";
import {
  CheckCircle,
  Target,
  Lightbulb,
  Plus,
  Download,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Users,
  MessageSquare,
  StickyNote,
  BarChart3,
  Loader2,
  Flame,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface BrainstormStreamingPageProps {
  params: {
    id: string;
  };
}

export default function BrainstormStreaming({
  params,
}: BrainstormStreamingPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const sessionId = parseInt(params.id);

  // Fetch session data to get participants info
  const { data: sessionData } = useQuery({
    queryKey: ["/api/brainstorm", sessionId],
    enabled: !!sessionId,
  });

  const {
    status,
    participants: streamParticipants,
    discussion,
    stickyNotes,
    keyTakeaways,
    participantStats,
    votingUpdate,
    analysis,
    currentSpeaker,
    meltdown,
    chaosCard,
    isComplete,
    error,
    closeStream,
    submitUserMessage,
    submitUserVote,
    skipUserTurn,
  } = useBrainstormStream(sessionId);

  // Use stream participants if available, otherwise fall back to session data
  const participants =
    streamParticipants.length > 0
      ? streamParticipants
      : (sessionData as any)?.session?.results?.participants || [];

  const handleNewBrainstorm = () => {
    closeStream();
    setLocation("/");
  };

  const handleExportResults = () => {
    if (!isComplete) {
      toast({
        title: "Export Not Available",
        description:
          "Please wait for the brainstorm to complete before exporting.",
        variant: "destructive",
      });
      return;
    }

    // Create a simple text export
    const exportText = `
THE OFFICE BRAINSTORM SESSION RESULTS

Participants: ${participants.map((p: any) => `${p.name} (${p.role})`).join(", ")}

Discussion:
${discussion.map((msg) => `${msg.speaker}: ${msg.message}`).join("\n\n")}

Sticky Notes:
${stickyNotes.map((note) => `- ${note.content} (by ${note.author}) - ${note.votes} votes`).join("\n")}

Top Ideas:
${[...stickyNotes]
  .sort((a, b) => b.votes - a.votes)
  .slice(0, 3)
  .map(
    (idea, i) =>
      `${i + 1}. "${idea.content}" by ${idea.author} - ${idea.votes} votes`,
  )
  .join("\n")}

Key Takeaways:
${keyTakeaways.map((takeaway, i) => `${i + 1}. ${takeaway}`).join("\n")}

Participant Statistics:
${participantStats.map((stat) => `${stat.name} (${stat.role}): ${stat.stickyNotesCreated} ideas created`).join("\n")}
    `;

    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brainstorm-${params.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your brainstorm results have been downloaded.",
    });
  };

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-500 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-office-dark mb-2">
              Oops! Something Went Wrong
            </h2>
            <p className="text-office-gray mb-6">{error}</p>
            <div className="space-x-3">
              <Button
                onClick={() => setLocation("/")}
                className="bg-office-blue hover:bg-blue-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const getPhaseIcon = () => {
    switch (status.phase) {
      case "initializing":
        return <Clock className="text-office-blue h-5 w-5" />;
      case "brainstorming":
        return <Lightbulb className="text-yellow-500 h-5 w-5" />;
      case "voting":
        return <Target className="text-green-500 h-5 w-5" />;
      case "analyzing":
        return <BarChart3 className="text-purple-500 h-5 w-5" />;
      case "finalizing":
        return <Plus className="text-blue-500 h-5 w-5" />;
      case "complete":
        return <CheckCircle className="text-green-600 h-5 w-5" />;
      default:
        return <Loader2 className="text-office-blue h-5 w-5 animate-spin" />;
    }
  };

  const getProgressValue = () => {
    switch (status.phase) {
      case "initializing":
        return 5;
      case "brainstorming":
        return Math.min(20 + (stickyNotes.length / 20) * 40, 60);
      case "voting":
        return (
          60 +
          (votingUpdate
            ? (votingUpdate.participantsWhoVoted.length /
                votingUpdate.totalParticipants) *
              15
            : 0)
        );
      case "analyzing":
        return (
          75 +
          (analysis ? (analysis.analyzedCount / analysis.totalCount) * 15 : 0)
        );
      case "finalizing":
        return 90;
      case "complete":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-8 min-h-screen">
      {/* Main Content Area with Left and Right Columns */}
      <div className="flex gap-6 mb-8 items-stretch">
        {/* Left Column (1/3 width - 500px) */}
        <div className="w-[500px] flex-shrink-0">
          <Card className="shadow-lg h-full">
            <CardContent className="p-6 h-full flex flex-col">
              {/* Session Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-office-title text-office-black mb-3">
                  THE OFFICE Brainstorm
                </h2>
                <p className="text-lg text-office-gray font-office-body">
                  {(sessionData as any)?.session?.topic}
                </p>

                <div className="flex items-center justify-center mt-4">
                  {getPhaseIcon()}
                  <span className="ml-2 font-medium text-office-dark">
                    {status.message}
                  </span>
                </div>
              </div>

              {/* Unhinged signal: live meltdown + chaos card */}
              <div className="mb-6 space-y-3">
                <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-red-800 flex items-center">
                      <Flame className="mr-2 h-4 w-4" />
                      Conference Room Meltdown Meter
                    </h3>
                    <span className="text-sm font-bold text-red-700">
                      {meltdown.score}%
                    </span>
                  </div>
                  <Progress value={meltdown.score} className="w-full" />
                  <p className="text-xs text-red-700 mt-2">
                    Higher means more chaos, more interruptions, and wilder dynamics.
                  </p>
                </div>

                {chaosCard && (
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
                    <h4 className="font-semibold text-purple-800 flex items-center mb-1">
                      <Zap className="mr-2 h-4 w-4" />
                      Chaos Card Active: {chaosCard.name}
                    </h4>
                    <p className="text-sm text-purple-700">{chaosCard.description}</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Remaining turns: {Math.max(chaosCard.remainingTurns, 0)}
                    </p>
                  </div>
                )}
              </div>

              {/* Participants List */}
              {participants.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-office-dark mb-3 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-office-blue" />
                    Session Participants
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {participants.map((participant: any, index: number) => (
                      <Badge
                        key={index}
                        className="bg-office-beige text-office-dark border border-office-blue"
                      >
                        {participant.name} ({participant.role})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* User Participation Interface */}
              {participants.some((p: any) => p.type === "user") &&
                !isComplete && (
                  <div className="mb-6">
                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-office-blue">
                      <UserParticipation
                        isUserTurn={currentSpeaker?.isUser || false}
                        phase={status.phase}
                        userName={
                          participants.find((p: any) => p.type === "user")
                            ?.name || "You"
                        }
                        userRole={
                          participants.find((p: any) => p.type === "user")
                            ?.role || "Participant"
                        }
                        onSubmitMessage={submitUserMessage}
                        onSkipTurn={skipUserTurn}
                        onVote={submitUserVote}
                        availableNotes={stickyNotes.map((note) => ({
                          id: note.id,
                          content: note.content,
                          author: note.author,
                        }))}
                      />
                    </div>
                  </div>
                )}

              {/* Live Discussion Feed */}
              {discussion.length > 0 && (
                <div className="mb-6 flex-1 min-h-0 flex flex-col">
                  <h3 className="font-semibold text-office-dark mb-4 flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-office-blue" />
                    Live Discussion ({discussion.length} messages)
                  </h3>
                  <div className="text-xs text-gray-500 mb-3 text-center bg-gray-100 rounded px-3 py-1">
                    📍 Most recent messages appear at the top
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
                    {[...discussion].reverse().map((message, index) => (
                      <div
                        key={discussion.length - 1 - index}
                        className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-office-blue"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={
                              message.avatar ||
                              `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face`
                            }
                            alt={message.speaker}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium text-office-dark">
                            {message.speaker}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{message.message}</p>

                        {/* Activity Statistics */}
                        {((message as any).stickyNotesAdded > 0 ||
                          (message as any).prosConsAdded > 0) && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 border-t">
                            {(message as any).stickyNotesAdded > 0 && (
                              <span className="mr-3">
                                📝 {(message as any).stickyNotesAdded} sticky
                                note
                                {(message as any).stickyNotesAdded > 1
                                  ? "s"
                                  : ""}{" "}
                                added
                              </span>
                            )}
                            {(message as any).prosConsAdded > 0 && (
                              <span>
                                💭 {(message as any).prosConsAdded} pros/cons
                                added
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (2/3 width - 800px) */}
        <div className="flex-1">
          <Card className="shadow-lg h-full">
            <CardContent className="p-6 h-full flex flex-col">
              {/* Sticky Notes Board */}
              {stickyNotes.length > 0 && (
                <div className="flex-1 min-h-0">
                  <h3 className="font-semibold text-office-dark mb-4 flex items-center">
                    <StickyNote className="mr-2 h-5 w-5 text-office-blue" />
                    Ideas Board ({stickyNotes.length} ideas)
                  </h3>
                  <div className="h-full overflow-y-auto px-4 py-2">
                    <StickyNotesBoard stickyNotes={stickyNotes} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Full Width Progress, Statistics, and Key Takeaways */}
      <div className="w-full">
        <Card className="shadow-lg h-fit">
          <CardContent className="p-6">
            {/* Voting Progress */}
            {votingUpdate && status.phase === "voting" && (
              <div className="mb-6 bg-orange-50 rounded-lg p-6 border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Voting in Progress
                </h4>
                <p className="text-orange-700 mb-3">
                  {votingUpdate.participantsWhoVoted.length} of{" "}
                  {votingUpdate.totalParticipants} participants have voted
                </p>
                <Progress
                  value={
                    (votingUpdate.participantsWhoVoted.length /
                      votingUpdate.totalParticipants) *
                    100
                  }
                  className="w-full"
                />
              </div>
            )}

            {/* Participant Statistics */}
            {participantStats.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-office-dark mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-office-blue" />
                  Participant Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participantStats.map((stat, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            stat.name === "Jim Halpert"
                              ? "bg-green-500"
                              : stat.name === "Dwight Schrute"
                                ? "bg-red-500"
                                : stat.name === "Pam Beesly"
                                  ? "bg-pink-500"
                                  : stat.name === "Michael Scott"
                                    ? "bg-blue-500"
                                    : stat.name === "Stanley Hudson"
                                      ? "bg-yellow-600"
                                      : stat.name === "Angela Martin"
                                        ? "bg-purple-500"
                                        : stat.name === "Kevin Malone"
                                          ? "bg-orange-500"
                                          : stat.name === "Creed Bratton"
                                            ? "bg-yellow-500"
                                            : "bg-gray-500"
                          }`}
                        ></div>
                        <div>
                          <h4 className="font-medium text-office-dark">
                            {stat.name}
                          </h4>
                          <p className="text-sm text-gray-600">{stat.role}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ideas Created:</span>
                          <span className="font-medium">
                            {stat.stickyNotesCreated}
                          </span>
                        </div>
                        {stat.undiscussedCards !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Undiscussed Cards:
                            </span>
                            <span className="font-medium">
                              {stat.undiscussedCards}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {keyTakeaways.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-office-dark mb-4 flex items-center">
                  <Target className="mr-2 h-5 w-5 text-office-blue" />
                  Answer from the Group
                </h3>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <ul className="space-y-3">
                    {keyTakeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start">
                        <span className="bg-blue-500 text-white text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-blue-800">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <Button
                onClick={handleNewBrainstorm}
                className="btn-office-primary py-3 px-6 text-lg shadow-lg hover:shadow-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Brainstorm
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
