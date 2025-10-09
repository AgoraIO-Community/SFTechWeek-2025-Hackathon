import { NextResponse } from "next/server";
import { GitHubFileSystemAdapter, LLMService } from "@principal-ade/ai-brain";
import { MemoryPalace } from "@a24z/core-library";

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
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

    // Load repository with MemoryPalace
    // Using a24z/core-library as test repository
    const owner = "a24z-ai";
    const repo = "core-library";
    const branch = "main";

    console.log(`Loading repository: ${owner}/${repo}...`);

    const fsAdapter = new GitHubFileSystemAdapter(owner, repo, branch, githubToken);
    await fsAdapter.prefetchAlexandriaFiles();

    const repoPath = fsAdapter.getGitHubPath();
    const palace = new MemoryPalace(repoPath, fsAdapter);

    const views = palace.listViews();
    console.log(`Loaded ${views.length} codebase views`);

    // Initialize LLM service
    const llmService = new LLMService({ apiKey: groqApiKey });

    // Generate response
    console.log(`Generating response for: "${message}"`);
    const response = await llmService.generateResponse(palace, message, {
      stream: false,
    });

    return NextResponse.json({
      status: "success",
      response,
      metadata: {
        repository: `${owner}/${repo}`,
        views: views.length,
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
