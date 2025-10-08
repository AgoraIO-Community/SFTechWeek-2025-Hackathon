/**
 * Test more specific technical questions
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { LLMService } from "./services/LLMService";

async function testSpecific() {
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

  // First, let's see what views are available
  const views = palace.listViews();
  console.log("📊 Available views:");
  views.slice(0, 3).forEach((view, i) => {
    console.log(`${i + 1}. ${view.name}`);
    console.log(`   Category: ${view.category}`);
    console.log(`   Description: ${view.description.substring(0, 100)}...`);
  });

  console.log("\n" + "=".repeat(70));
  console.log("Q: Tell me about the path management system in detail");
  console.log("=".repeat(70) + "\n");

  await llmService.generateResponse(
    palace,
    "Tell me about the path management system in detail. What files are involved?",
    { stream: true }
  );

  console.log("\n" + "=".repeat(70));
  console.log("Q: How does the task system work?");
  console.log("=".repeat(70) + "\n");

  await llmService.generateResponse(
    palace,
    "How does the task system work? What are the main components?",
    { stream: true }
  );
}

testSpecific();
