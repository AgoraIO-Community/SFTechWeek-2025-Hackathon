/**
 * Demo: Two-Stage View-Aware Implementation
 *
 * This demonstrates the enhanced conversation capabilities:
 * - Intent classification (overview, implementation, usage, comparison)
 * - Smart context loading (markdown only vs markdown + code)
 * - Tailored responses based on question type
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { LLMService, ConversationMessage } from "./services/LLMService";

async function demoTwoStage() {
  console.log("🚀 Two-Stage View-Aware Demo\n");

  const githubToken = process.env.GITHUB_TOKEN;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!githubToken || !groqApiKey) {
    console.error("❌ Missing environment variables");
    console.error("   Required: GITHUB_TOKEN, GROQ_API_KEY");
    process.exit(1);
  }

  // Setup
  console.log("1️⃣  Loading repository...");
  const fsAdapter = new GitHubFileSystemAdapter(
    "a24z-ai",
    "core-library",
    "main",
    githubToken
  );
  await fsAdapter.prefetchAlexandriaFiles();
  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);
  const llmService = new LLMService({ apiKey: groqApiKey });

  const views = palace.listViews();
  console.log(`   ✅ Loaded ${views.length} codebase views\n`);

  // Conversation history
  const history: ConversationMessage[] = [];

  // Test different question types
  const testQuestions = [
    {
      type: "Overview Question",
      question: "What is this codebase about?",
      expectedIntent: "overview",
    },
    {
      type: "Implementation Question",
      question: "How does the MemoryPalace class work?",
      expectedIntent: "implementation",
    },
    {
      type: "Usage Question",
      question: "How do I use the getNotes method?",
      expectedIntent: "usage",
    },
    {
      type: "Comparison Question",
      question: "What's the difference between getView and listViews?",
      expectedIntent: "comparison",
    },
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const { type, question, expectedIntent } = testQuestions[i];

    console.log("\n" + "=".repeat(80));
    console.log(`TEST ${i + 1}: ${type}`);
    console.log("=".repeat(80));
    console.log(`QUESTION: "${question}"\n`);

    try {
      // Use two-stage view-aware response
      const { response, intent } = await llmService.generateViewAwareResponse(
        palace,
        fsAdapter,
        question,
        history,
        { stream: true }
      );

      // Verify intent classification
      console.log("\n");
      console.log("─".repeat(80));
      console.log(`✅ Intent Classification:`);
      console.log(`   Expected: ${expectedIntent}`);
      console.log(`   Detected: ${intent.type}`);
      console.log(`   Match: ${intent.type === expectedIntent ? "✅ YES" : "❌ NO"}`);
      console.log(`   Confidence: ${(intent.confidence * 100).toFixed(0)}%`);
      console.log(`   Views loaded: ${intent.relevantViews.length}`);
      console.log(`   Files loaded: ${intent.relevantFiles.length}`);
      console.log("─".repeat(80));

      // Add to history for next question
      history.push({ role: "user", content: question });
      history.push({ role: "assistant", content: response });

      // Pause between questions
      if (i < testQuestions.length - 1) {
        console.log("\n⏸️  Press Enter to continue to next question...");
        // In non-interactive mode, just continue
        await new Promise((resolve) => global.setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`\n❌ Error processing question: ${error}`);
    }
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("✅ Demo completed!");
  console.log(`📊 Processed ${testQuestions.length} different question types`);
  console.log(`💬 Conversation history: ${history.length} messages`);
  console.log("=".repeat(80));
  console.log("\n");
}

// Run demo
demoTwoStage().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
