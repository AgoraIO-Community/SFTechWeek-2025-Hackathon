/**
 * Demo: Load a GitHub repository using MemoryPalace
 *
 * This demonstrates:
 * - Fetching repository from GitHub
 * - Pre-caching .alexandria files
 * - Using MemoryPalace to access views and guidance
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";

async function demo() {
  console.log("🚀 Principal AI - GitHub Repository Demo\n");

  // Configuration
  const owner = "a24z-ai";
  const repo = "core-library";
  const branch = "main";
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error("❌ GITHUB_TOKEN environment variable not set");
    console.log("   Set it with: export GITHUB_TOKEN=your_token_here");
    process.exit(1);
  }

  console.log(`📚 Repository: ${owner}/${repo}\n`);

  try {
    // 1. Create GitHub adapter
    console.log("1️⃣  Initializing GitHub adapter...");
    const fsAdapter = new GitHubFileSystemAdapter(owner, repo, branch, token);

    // 2. Pre-fetch .alexandria files
    console.log("2️⃣  Fetching repository data...");
    await fsAdapter.prefetchAlexandriaFiles();

    // 3. Create MemoryPalace
    console.log("3️⃣  Creating MemoryPalace...");
    const repoPath = fsAdapter.getGitHubPath();
    const palace = new MemoryPalace(repoPath, fsAdapter);
    console.log("✅ MemoryPalace initialized!\n");

    // 4. Get guidance
    const fullGuidance = palace.getFullGuidance();
    console.log(`📖 Repository Guidance:`);
    console.log(`   ${fullGuidance.guidance.substring(0, 200)}...\n`);

    // 5. List all codebase views
    const views = palace.listViews();
    console.log(`📊 Found ${views.length} codebase views:`);

    views.slice(0, 5).forEach((view, index) => {
      console.log(`\n   ${index + 1}. ${view.name}`);
      console.log(`      Category: ${view.category}`);
      console.log(`      Overview: ${view.overviewPath}`);
      console.log(`      Reference Groups: ${Object.keys(view.referenceGroups).length}`);
    });

    if (views.length > 5) {
      console.log(`\n   ... and ${views.length - 5} more views`);
    }

    // 6. Get a specific view
    if (views.length > 0) {
      const firstView = palace.getView(views[0].id);
      if (firstView) {
        console.log(`\n🔍 View Details: ${firstView.name}`);
        console.log(`   ${firstView.description.substring(0, 150)}...`);

        if (Object.keys(firstView.referenceGroups).length > 0) {
          console.log(`\n   Reference Groups:`);
          Object.entries(firstView.referenceGroups)
            .slice(0, 3)
            .forEach(([name, group]) => {
              console.log(`      - ${name}: ${group.files.length} files`);
            });
        }
      }
    }

    console.log("\n✅ Demo completed successfully!");

    return {
      guidance: fullGuidance,
      views,
    };
  } catch (error) {
    console.error("\n❌ Error:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    throw error;
  }
}

// Run demo
demo();
