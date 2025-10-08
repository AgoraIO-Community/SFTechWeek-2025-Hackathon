/**
 * Test realistic questions a first-time user would ask
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { LLMService } from "./services/LLMService";

async function testQuestions() {
  console.log("🧪 Testing realistic first-time user questions\n");

  const githubToken = process.env.GITHUB_TOKEN;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!githubToken || !groqApiKey) {
    console.error("❌ Missing environment variables");
    process.exit(1);
  }

  // Setup
  const fsAdapter = new GitHubFileSystemAdapter("a24z-ai", "core-library", "main", githubToken);
  await fsAdapter.prefetchAlexandriaFiles();
  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);
  const llmService = new LLMService({ apiKey: groqApiKey });

  console.log("✅ Setup complete\n");

  // Test questions
  const questions = [
    "How do I get started using this library?",
    "Where is the MemoryPalace class implemented?",
    "What does the FileSystemAdapter do?",
    "How do I create notes in this system?",
  ];

  for (let i = 0; i < questions.length; i++) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`Q${i + 1}: ${questions[i]}`);
    console.log("=".repeat(70));
    console.log();

    await llmService.generateResponse(palace, questions[i], { stream: true });
    console.log();
  }

  console.log("\n✅ All questions tested\n");
}

testQuestions();
