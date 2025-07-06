import { 
  brainstormSessions, 
  type BrainstormSession, 
  type InsertBrainstormSession,
  type BrainstormResults 
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  createBrainstormSession(session: InsertBrainstormSession): Promise<BrainstormSession>;
  getBrainstormSession(id: number): Promise<BrainstormSession | undefined>;
  updateBrainstormResults(id: number, results: BrainstormResults): Promise<BrainstormSession>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private brainstormSessions: Map<number, BrainstormSession>;
  private currentUserId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.brainstormSessions = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBrainstormSession(session: InsertBrainstormSession): Promise<BrainstormSession> {
    const id = this.currentSessionId++;
    const brainstormSession: BrainstormSession = {
      id,
      topic: session.topic,
      selectedCharacters: session.selectedCharacters,
      aiAssistant: session.aiAssistant ?? false,
      userParticipation: session.userParticipation ?? false,
      results: null,
      createdAt: new Date(),
    };
    this.brainstormSessions.set(id, brainstormSession);
    return brainstormSession;
  }

  async getBrainstormSession(id: number): Promise<BrainstormSession | undefined> {
    return this.brainstormSessions.get(id);
  }

  async updateBrainstormResults(id: number, results: BrainstormResults): Promise<BrainstormSession> {
    const session = this.brainstormSessions.get(id);
    if (!session) {
      throw new Error("Brainstorm session not found");
    }
    
    const updatedSession = { ...session, results };
    this.brainstormSessions.set(id, updatedSession);
    return updatedSession;
  }
}

export const storage = new MemStorage();
