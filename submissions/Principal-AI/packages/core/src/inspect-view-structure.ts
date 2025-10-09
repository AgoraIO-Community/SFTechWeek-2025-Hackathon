/**
 * Inspect view structure to understand why coverage is 0%
 */

import * as fs from "fs";
import * as path from "path";
import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";

// Load GitHub token
function loadGitHubToken(): string | undefined {
  try {
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
    return undefined;
  } catch {
    return undefined;
  }
}

async function inspectViews(repo: string) {
  console.log(`\n📋 Inspecting views in ${repo}...\n`);

  const token = loadGitHubToken();
  const adapter = new GitHubFileSystemAdapter("a24z-ai", repo, "main", token);

  await adapter.initialize();
  await adapter.prefetchAlexandriaFiles();

  const githubPath = adapter.getGitHubPath();
  const palace = new MemoryPalace(githubPath, adapter);

  const views = palace.listViews();

  console.log(`Found ${views.length} views:\n`);

  for (const view of views.slice(0, 3)) {
    console.log(`View: ${view.name} (${view.id})`);
    console.log(`  Description: ${view.description}`);
    console.log(`  Reference Groups: ${Object.keys(view.referenceGroups || {}).length}`);

    if (view.referenceGroups) {
      for (const [cellName, cell] of Object.entries(view.referenceGroups).slice(0, 2)) {
        console.log(`\n  Cell: ${cellName}`);
        console.log(`    Type: ${cell ? typeof cell : 'null'}`);
        console.log(`    Has 'files' property: ${'files' in (cell || {})}`);

        if ('files' in (cell || {})) {
          const fileCell = cell as { files?: string[] };
          console.log(`    Files array length: ${fileCell.files?.length || 0}`);
          if (fileCell.files && fileCell.files.length > 0) {
            console.log(`    Sample files:`);
            fileCell.files.slice(0, 3).forEach((f: string) => {
              console.log(`      - ${f}`);
            });
          }
        } else {
          console.log(`    Cell structure:`, JSON.stringify(cell, null, 2).slice(0, 200));
        }
      }
    }

    console.log("\n" + "-".repeat(60));
  }
}

// Test with both a repo that has coverage and one that doesn't
async function main() {
  await inspectViews("core-library"); // Has 21% coverage
  await inspectViews("a24z-memory");   // Has 0% coverage
}

main().catch(console.error);
