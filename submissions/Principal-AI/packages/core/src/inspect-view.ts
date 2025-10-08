/**
 * Inspect what's actually in a codebase view
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";

async function inspectView() {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error("❌ GITHUB_TOKEN not set");
    process.exit(1);
  }

  const fsAdapter = new GitHubFileSystemAdapter("a24z-ai", "core-library", "main", githubToken);
  await fsAdapter.prefetchAlexandriaFiles();
  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);

  const views = palace.listViews();
  const firstView = palace.getView(views[0].id);

  if (firstView) {
    console.log("📊 View:", firstView.name);
    console.log("📁 Category:", firstView.category);
    console.log("\n📝 Description:");
    console.log(firstView.description);

    console.log("\n🔗 Reference Groups:");
    Object.entries(firstView.referenceGroups).forEach(([name, group]) => {
      console.log(`\n  ${name}:`);
      console.log(`    Files: ${group.files.length}`);
      group.files.slice(0, 5).forEach((file) => {
        console.log(`      - ${file}`);
      });
      if (group.files.length > 5) {
        console.log(`      ... and ${group.files.length - 5} more`);
      }
    });
  }
}

inspectView();
