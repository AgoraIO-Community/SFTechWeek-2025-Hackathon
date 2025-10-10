/**
 * Test improved LLM with file references
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { LLMService } from "./services/LLMService";

async function testImproved() {
  const githubToken = process.env.GITHUB_TOKEN;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!githubToken || !groqApiKey) {
    console.error("❌ Missing environment variables");
    process.exit(1);
  }

  const fsAdapter = new GitHubFileSystemAdapter("a24z-ai", "core-library", "main", githubToken);
  await fsAdapter.prefetchAlexandriaFiles();
  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);
  const llmService = new LLMService({ apiKey: groqApiKey });

  const questions = [
    "Where is the MemoryPalace class implemented?",
    "Where is the FileSystemAdapter defined?",
    "What files implement the task system?",
  ];

  for (const q of questions) {
    console.log("\n" + "=".repeat(70));
    console.log(`Q: ${q}`);
    console.log("=".repeat(70) + "\n");

    await llmService.generateResponse(palace, q, { stream: true });
    console.log();
  }
}

testImproved();
