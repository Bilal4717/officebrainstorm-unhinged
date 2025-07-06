import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createBrainstormSchema } from "@shared/schema";
import { generateBrainstormWithStreaming, subscribeToSession, unsubscribeFromSession, submitUserInput } from "./services/brainstorm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new brainstorm session with streaming
  app.post("/api/brainstorm", async (req, res) => {
    try {
      const validatedData = createBrainstormSchema.parse(req.body);
      
      // Create the session
      const session = await storage.createBrainstormSession(validatedData);
      
      // Return session ID immediately for streaming
      res.json({
        success: true,
        sessionId: session.id,
        streaming: true
      });
      
      // Start generating results in background with streaming
      generateBrainstormWithStreaming({
        sessionId: session.id,
        topic: validatedData.topic,
        selectedCharacters: validatedData.selectedCharacters,
        aiAssistant: validatedData.aiAssistant || false,
        userParticipation: validatedData.userParticipation || false,
        userName: validatedData.userName,
        userRole: validatedData.userRole
      }).then(async (results) => {
        // Update session with final results
        await storage.updateBrainstormResults(session.id, results);
        console.log(`Brainstorm session ${session.id} completed successfully`);
      }).catch((error: any) => {
        console.error("Error in background brainstorm generation:", error);
      });
      
    } catch (error: any) {
      console.error("Error creating brainstorm:", error);
      res.status(400).json({ 
        success: false,
        message: error?.message || "Failed to create brainstorm session" 
      });
    }
  });

  // Get a brainstorm session
  app.get("/api/brainstorm/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getBrainstormSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ 
          success: false,
          message: "Brainstorm session not found" 
        });
      }
      
      res.json({
        success: true,
        session
      });
      
    } catch (error) {
      console.error("Error fetching brainstorm:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch brainstorm session" 
      });
    }
  });

  // Server-Sent Events endpoint for real-time streaming
  app.get("/api/brainstorm/:id/stream", (req: Request, res: Response) => {
    const sessionId = parseInt(req.params.id);
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    console.log(`SSE client connected for session ${sessionId}`);

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

    // Set up callback to send updates via SSE
    subscribeToSession(sessionId, (updateData) => {
      try {
        res.write(`data: ${JSON.stringify(updateData)}\n\n`);
      } catch (error) {
        console.error('Error sending SSE update:', error);
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(`SSE client disconnected from session ${sessionId}`);
      unsubscribeFromSession(sessionId);
    });
  });

  // User interaction endpoints
  app.post("/api/brainstorm/:id/user-message", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { message, stickyNotes } = req.body;
      
      // Submit user message to the brainstorm workflow
      submitUserInput(sessionId, {
        type: 'message',
        message,
        stickyNotes
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error handling user message:", error);
      res.status(500).json({ success: false, message: "Failed to submit message" });
    }
  });

  app.post("/api/brainstorm/:id/user-vote", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { selectedNotes, reasoning } = req.body;
      
      // Submit user vote to the brainstorm workflow
      submitUserInput(sessionId, {
        type: 'vote',
        selectedNotes,
        reasoning
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error handling user vote:", error);
      res.status(500).json({ success: false, message: "Failed to submit vote" });
    }
  });

  app.post("/api/brainstorm/:id/skip-turn", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Submit skip turn to the brainstorm workflow
      submitUserInput(sessionId, {
        type: 'skip'
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error handling skip turn:", error);
      res.status(500).json({ success: false, message: "Failed to skip turn" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
