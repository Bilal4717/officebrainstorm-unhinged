import { StickyNote, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getColorClasses } from "@/lib/colors";

interface StickyNoteBoardProps {
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
}

export function StickyNotesBoard({ stickyNotes }: StickyNoteBoardProps) {
  if (!stickyNotes || stickyNotes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <StickyNote className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>
          No sticky notes yet. Ideas will appear here as the discussion
          progresses.
        </p>
      </div>
    );
  }

  // Colors are now coordinated per character

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {stickyNotes.map((note, index) => {
          const colorClasses = getColorClasses(note.color);

          return (
            <Card
              key={note.id}
              className={`${colorClasses.bg} ${colorClasses.border} border-2 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-rotate-1`}
              style={{
                transform: `rotate(${((index % 3) - 1) * 2}deg)`,
                minHeight: "120px",
              }}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-800 leading-tight flex-1">
                      {note.content}
                    </p>
                    {note.votes > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 flex items-center gap-1 bg-red-100 text-red-800 border-red-300"
                      >
                        <Heart className="h-3 w-3 fill-current" />
                        {note.votes}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={note.avatar} alt={note.author} />
                        <AvatarFallback className="text-xs">
                          {note.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 font-medium">
                        {note.author}
                      </span>
                    </div>
                  </div>

                  {/* Pros and Cons */}
                  {(note.pros.length > 0 || note.cons.length > 0) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {note.pros.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-green-600 font-medium">👍</span>
                          <span className="text-green-700">
                            {note.pros.join(" / ")}
                          </span>
                        </div>
                      )}
                      {note.cons.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-red-600 font-medium">👎</span>
                          <span className="text-red-700">
                            {note.cons.join(" / ")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
