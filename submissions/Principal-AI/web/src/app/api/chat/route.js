import { NextResponse } from "next/server";
import { GitHubFileSystemAdapter, LLMService } from "@principal-ade/ai-brain";
import { MemoryPalace } from "@a24z/core-library";

// In-memory cache for MemoryPalace instances (keyed by sessionId)
// In production, this should be Redis or similar
// Exported so load-repo can share the same cache
export const palaceCache = new Map();
export const adapterCache = new Map();

export async function POST(request) {
  try {
    const { message, conversationHistory = [], sessionId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get API keys from environment
    const githubToken = process.env.GITHUB_TOKEN;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!githubToken || !groqApiKey) {
      return NextResponse.json(
        { error: "Missing required API keys (GITHUB_TOKEN or GROQ_API_KEY)" },
        { status: 500 }
      );
    }

    // Repository configuration
    const owner = "a24z-ai";
    const repo = "core-library";
    const branch = "main";
    const cacheKey = `${owner}/${repo}/${branch}/${sessionId}`;

    // Get or create MemoryPalace instance
    let palace = palaceCache.get(cacheKey);
    let fsAdapter = adapterCache.get(cacheKey);

    if (!palace || !fsAdapter) {
      console.log(`Loading repository: ${owner}/${repo} for session ${sessionId}...`);

      fsAdapter = new GitHubFileSystemAdapter(owner, repo, branch, githubToken);
      await fsAdapter.prefetchAlexandriaFiles();

      const repoPath = fsAdapter.getGitHubPath();
      palace = new MemoryPalace(repoPath, fsAdapter);

      // Cache for this session
      palaceCache.set(cacheKey, palace);
      adapterCache.set(cacheKey, fsAdapter);

      const views = palace.listViews();
      console.log(`Loaded ${views.length} codebase views`);
    } else {
      console.log(`Using cached MemoryPalace for session ${sessionId}`);
    }

    // Initialize LLM service
    const llmService = new LLMService({ apiKey: groqApiKey });

    // Generate response with conversation history
    console.log(`Generating response for: "${message}"`);
    console.log(`Conversation history length: ${conversationHistory.length}`);

    const response = await llmService.generateConversationResponse(
      palace,
      message,
      conversationHistory,
      {
        stream: false,
      }
    );

    return NextResponse.json({
      status: "success",
      response,
      metadata: {
        repository: `${owner}/${repo}`,
        views: palace.listViews().length,
        conversationLength: conversationHistory.length + 1,
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
