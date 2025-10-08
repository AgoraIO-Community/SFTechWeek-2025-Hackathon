/**
 * Demo: Full integration - GitHub + MemoryPalace + Groq LLM
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { LLMService } from "./services/LLMService";

async function demo() {
  console.log("🚀 Principal AI - Full LLM Integration Demo\n");

  // Check environment variables
  const githubToken = process.env.GITHUB_TOKEN;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!githubToken) {
    console.error("❌ GITHUB_TOKEN environment variable not set");
    process.exit(1);
  }

  if (!groqApiKey) {
    console.error("❌ GROQ_API_KEY environment variable not set");
    process.exit(1);
  }

  // Configuration
  const owner = "a24z-ai";
  const repo = "core-library";
  const branch = "main";

  console.log(`📚 Repository: ${owner}/${repo}\n`);

  try {
    // 1. Load repository with MemoryPalace
    console.log("1️⃣  Loading repository...");
    const fsAdapter = new GitHubFileSystemAdapter(owner, repo, branch, githubToken);
    await fsAdapter.prefetchAlexandriaFiles();

    const repoPath = fsAdapter.getGitHubPath();
    const palace = new MemoryPalace(repoPath, fsAdapter);

    const views = palace.listViews();
    console.log(`   ✅ Loaded ${views.length} codebase views\n`);

    // 2. Initialize LLM service
    console.log("2️⃣  Initializing LLM service...");
    const llmService = new LLMService({ apiKey: groqApiKey });
    console.log("   ✅ Groq LLM ready\n");

    // 3. Ask a question
    const question = "What is this codebase about? Give me a brief overview.";
    console.log(`3️⃣  Question: "${question}"\n`);

    console.log("📥 Response:\n");
    const response = await llmService.generateResponse(palace, question, {
      stream: true,
    });

    console.log("\n✅ Demo completed successfully!\n");

    return { response, views: views.length };
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
