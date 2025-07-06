import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const brainstormSessions = pgTable("brainstorm_sessions", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  selectedCharacters: text("selected_characters").array().notNull(),
  aiAssistant: boolean("ai_assistant").default(false),
  userParticipation: boolean("user_participation").default(false),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBrainstormSessionSchema = createInsertSchema(brainstormSessions).omit({
  id: true,
  results: true,
  createdAt: true,
});

export const createBrainstormSchema = insertBrainstormSessionSchema.extend({
  topic: z.string().min(1, "Topic is required").max(500, "Topic too long"),
  selectedCharacters: z.array(z.string()).min(1, "At least one character required").max(4, "Maximum 4 characters allowed"),
  userName: z.string().optional(),
  userRole: z.string().optional(),
}).refine((data) => {
  if (data.userParticipation) {
    return data.userName && data.userName.trim().length > 0 && data.userRole && data.userRole.trim().length > 0;
  }
  return true;
}, {
  message: "Name and role are required when user participation is enabled",
  path: ["userName"]
});

export type InsertBrainstormSession = z.infer<typeof insertBrainstormSessionSchema>;
export type BrainstormSession = typeof brainstormSessions.$inferSelect;
export type CreateBrainstormRequest = z.infer<typeof createBrainstormSchema>;

export interface BrainstormResults {
  topic: string;
  participants: Array<{
    name: string;
    role: string;
    avatar: string;
    type: 'character' | 'ai' | 'user';
    color: string;
  }>;
  discussion: Array<{
    speaker: string;
    message: string;
    avatar: string;
    type: 'character' | 'ai' | 'user';
  }>;
  keyTakeaways: string[];
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

  participantStats: Array<{
    name: string;
    role: string;
    stickyNotesCreated: number;
    undiscussedCards?: number;
  }>;
}
