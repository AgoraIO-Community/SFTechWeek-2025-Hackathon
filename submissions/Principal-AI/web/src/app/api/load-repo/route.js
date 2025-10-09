import { NextResponse } from "next/server";
import { GitHubFileSystemAdapter } from "@principal-ade/ai-brain";
import { MemoryPalace } from "@a24z/core-library";

// Import the same cache instances from the chat route
// This ensures both endpoints share the same cache
import { palaceCache, adapterCache } from "../chat/route.js";

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get API keys from environment
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return NextResponse.json(
        { error: "Missing required API key (GITHUB_TOKEN)" },
        { status: 500 }
      );
    }

    // Repository configuration
    const owner = "a24z-ai";
    const repo = "core-library";
    const branch = "main";
    const cacheKey = `${owner}/${repo}/${branch}/${sessionId}`;

    // Check if already loaded
    if (palaceCache.has(cacheKey)) {
      const palace = palaceCache.get(cacheKey);
      return NextResponse.json({
        status: "success",
        message: "Repository already loaded",
        metadata: {
          repository: `${owner}/${repo}`,
          views: palace.listViews().length,
          cached: true,
        },
      });
    }

    console.log(`Loading repository: ${owner}/${repo} for session ${sessionId}...`);

    // Load repository with MemoryPalace
    const fsAdapter = new GitHubFileSystemAdapter(owner, repo, branch, githubToken);
    await fsAdapter.prefetchAlexandriaFiles();

    const repoPath = fsAdapter.getGitHubPath();
    const palace = new MemoryPalace(repoPath, fsAdapter);

    // Cache for this session
    palaceCache.set(cacheKey, palace);
    adapterCache.set(cacheKey, fsAdapter);

    const views = palace.listViews();
    console.log(`Loaded ${views.length} codebase views`);

    return NextResponse.json({
      status: "success",
      message: "Repository loaded successfully",
      metadata: {
        repository: `${owner}/${repo}`,
        views: views.length,
        viewNames: views,
        cached: false,
      },
    });
  } catch (error) {
    console.error("Error loading repository:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load repository" },
      { status: 500 }
    );
  }
}
