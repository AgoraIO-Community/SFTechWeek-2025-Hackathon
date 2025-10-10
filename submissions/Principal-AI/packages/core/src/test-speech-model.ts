/**
 * Test speech-optimized model vs standard model
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { LLMService } from "./services/LLMService";

async function testSpeechModel() {
  const githubToken = process.env.GITHUB_TOKEN;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!githubToken || !groqApiKey) {
    console.error("❌ Missing environment variables");
    process.exit(1);
  }

  // Setup
  console.log("🚀 Loading repository...\n");
  const fsAdapter = new GitHubFileSystemAdapter("a24z-ai", "core-library", "main", githubToken);
  await fsAdapter.prefetchAlexandriaFiles();
  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);

  const question = "What is the MemoryPalace class and where is it implemented?";

  // Test 1: Speech-optimized model (default)
  console.log("=" .repeat(70));
  console.log("TEST 1: llama-3.1-8b-instant (speech-optimized)");
  console.log("=" .repeat(70));
  console.log(`Q: ${question}\n`);

  const start1 = Date.now();
  const llmFast = new LLMService({ apiKey: groqApiKey });
  await llmFast.generateResponse(palace, question, { stream: true });
  const time1 = Date.now() - start1;
  console.log(`\n⏱️  Time: ${time1}ms\n`);

  // Test 2: Standard model
  console.log("\n" + "=".repeat(70));
  console.log("TEST 2: llama-3.3-70b-versatile (standard)");
  console.log("=".repeat(70));
  console.log(`Q: ${question}\n`);

  const start2 = Date.now();
  const llmStandard = new LLMService({ apiKey: groqApiKey, model: "llama-3.3-70b-versatile" });
  await llmStandard.generateResponse(palace, question, { stream: true });
  const time2 = Date.now() - start2;
  console.log(`\n⏱️  Time: ${time2}ms\n`);

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`Speech-optimized: ${time1}ms`);
  console.log(`Standard model:   ${time2}ms`);
  console.log(`Speed improvement: ${((time2 - time1) / time2 * 100).toFixed(1)}% faster`);
}

testSpeechModel();
