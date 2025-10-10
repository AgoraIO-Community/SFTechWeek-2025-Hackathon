/**
 * Test coverage for all a24z-ai repositories
 */

import * as fs from "fs";
import * as path from "path";
import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { getGitHubCodebaseCoverage } from "./utils/GitHubCoverageCalculator";

// Load GitHub token from web/.env.local
function loadGitHubToken(): string | undefined {
  try {
    // Try multiple possible paths relative to process.cwd()
    const possiblePaths = [
      path.join(process.cwd(), "../web/.env.local"),
      path.join(process.cwd(), "../../web/.env.local"),
      "/Users/griever/Developer/SFTechWeek-2025-Hackathon/submissions/Principal-AI/web/.env.local",
    ];

    for (const envPath of possiblePaths) {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/GITHUB_TOKEN=(.+)/);
        if (match) {
          return match[1].trim();
        }
      }
    }

    console.warn("⚠️  Could not load GitHub token from web/.env.local");
    return undefined;
  } catch (error) {
    console.warn("⚠️  Error loading GitHub token:", error);
    return undefined;
  }
}

const A24Z_REPOS = [
  "a24z-memory",
  "principal.md",
  "git-gallery-palette",
  "specktor-configurations",
  "agent-monitor",
  "Alexandria",
  "themed-markdown",
  // "pixeltable", // Skipped - large repo
  "mermaid-parser",
  "markdown-search",
  "principal-mcp",
  "alexandria-cli",
  "core-library",
  "panels",
  // "cline", // Skipped
  "industry-theme",
  "markdown-utils",
];

interface RepoResult {
  repo: string;
  success: boolean;
  coverage?: number;
  totalFiles?: number;
  coveredFiles?: number;
  error?: string;
}

async function testRepositoryCoverage(
  repo: string,
  token?: string
): Promise<RepoResult> {
  try {
    console.log(`\n🔍 Testing: ${repo}...`);

    const adapter = new GitHubFileSystemAdapter("a24z-ai", repo, "main", token);

    // Initialize and fetch
    await adapter.initialize();
    await adapter.prefetchAlexandriaFiles();

    // Create palace
    const githubPath = adapter.getGitHubPath();
    const palace = new MemoryPalace(githubPath, adapter);

    // Calculate coverage
    const coverage = getGitHubCodebaseCoverage(adapter, palace);

    console.log(`   ✅ Coverage: ${coverage.coveragePercentage.toFixed(2)}%`);

    return {
      repo,
      success: true,
      coverage: coverage.coveragePercentage,
      totalFiles: coverage.totalFiles,
      coveredFiles: coverage.coveredFiles,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`   ⚠️  Error: ${errorMsg}`);

    return {
      repo,
      success: false,
      error: errorMsg,
    };
  }
}

async function testAllRepositories() {
  console.log("📊 Testing coverage for all a24z-ai repositories\n");

  const token = loadGitHubToken();
  if (token) {
    console.log("✅ Using GitHub token for authenticated requests (5000/hour limit)\n");
  } else {
    console.log("⚠️  No GitHub token - using unauthenticated requests (60/hour limit)\n");
  }

  console.log("=" .repeat(60));

  const results: RepoResult[] = [];

  for (const repo of A24Z_REPOS) {
    const result = await testRepositoryCoverage(repo, token);
    results.push(result);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📈 COVERAGE SUMMARY\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`Total repositories: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    console.log("✅ Repositories with Alexandria views:");
    console.log("-".repeat(60));

    // Sort by coverage percentage (descending)
    const sorted = successful
      .filter((r) => (r.coverage ?? 0) > 0)
      .sort((a, b) => (b.coverage ?? 0) - (a.coverage ?? 0));

    if (sorted.length > 0) {
      for (const result of sorted) {
        const coverage = result.coverage?.toFixed(2) ?? "0";
        const files = `${result.coveredFiles}/${result.totalFiles}`;
        console.log(
          `   ${result.repo.padEnd(30)} ${coverage.padStart(6)}%  (${files} files)`
        );
      }
    } else {
      console.log("   None found with coverage > 0%");
    }

    // Repositories with 0% coverage (no views)
    const noCoverage = successful.filter((r) => (r.coverage ?? 0) === 0);
    if (noCoverage.length > 0) {
      console.log("\n⚪ Repositories without Alexandria views:");
      console.log("-".repeat(60));
      for (const result of noCoverage) {
        console.log(`   ${result.repo.padEnd(30)} ${result.totalFiles ?? 0} source files`);
      }
    }
  }

  if (failed.length > 0) {
    console.log("\n❌ Failed repositories:");
    console.log("-".repeat(60));
    for (const result of failed) {
      console.log(`   ${result.repo.padEnd(30)} ${result.error}`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

// Run the tests
testAllRepositories().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
