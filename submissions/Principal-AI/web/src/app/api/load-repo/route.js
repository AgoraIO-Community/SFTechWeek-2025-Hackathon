import { NextResponse } from "next/server";
import { GitHubFileSystemAdapter } from "@principal-ade/ai-brain";
import { getGitHubCodebaseCoverage } from "@principal-ade/ai-brain/dist/utils/GitHubCoverageCalculator.js";
import { MemoryPalace } from "@a24z/core-library";
import { palaceCache, adapterCache } from "@/lib/cache";

export async function POST(request) {
  try {
    const { sessionId, repoUrl } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
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

    // Parse repository from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 }
      );
    }

    const owner = match[1];
    const repo = match[2];
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

    // Calculate coverage
    console.log('Calculating codebase coverage...');
    const coverage = getGitHubCodebaseCoverage(fsAdapter, palace);
    console.log(`Coverage: ${coverage.coveragePercentage.toFixed(2)}% (${coverage.coveredFiles}/${coverage.totalFiles} files)`);

    return NextResponse.json({
      status: "success",
      message: "Repository loaded successfully",
      metadata: {
        repository: `${owner}/${repo}`,
        views: views.length,
        viewNames: views,
        cached: false,
        coverage: {
          totalFiles: coverage.totalFiles,
          coveredFiles: coverage.coveredFiles,
          coveragePercentage: coverage.coveragePercentage,
          filesByExtension: Object.fromEntries(coverage.filesByExtension),
        },
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
