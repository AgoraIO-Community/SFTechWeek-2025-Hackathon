/**
 * Test conversational back-and-forth with history
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { LLMService, ConversationMessage } from "./services/LLMService";

async function testConversation() {
  const githubToken = process.env.GITHUB_TOKEN;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!githubToken || !groqApiKey) {
    console.error("❌ Missing environment variables");
    process.exit(1);
  }

  console.log("🚀 Testing Conversational AI with History\n");

  // Setup
  const fsAdapter = new GitHubFileSystemAdapter("a24z-ai", "core-library", "main", githubToken);
  await fsAdapter.prefetchAlexandriaFiles();
  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);
  const llmService = new LLMService({ apiKey: groqApiKey });

  // Conversation history
  const history: ConversationMessage[] = [];

  // Turn 1
  console.log("=" .repeat(70));
  console.log("USER: What is the MemoryPalace class?");
  console.log("=" .repeat(70) + "\n");

  const response1 = await llmService.generateConversationResponse(
    palace,
    "What is the MemoryPalace class?",
    history,
    { stream: true }
  );

  // Add to history
  history.push({ role: "user", content: "What is the MemoryPalace class?" });
  history.push({ role: "assistant", content: response1 });

  // Turn 2 - Ask follow-up (uses context from Turn 1)
  console.log("\n" + "=" .repeat(70));
  console.log("USER: Where is it implemented?");
  console.log("=" .repeat(70) + "\n");

  const response2 = await llmService.generateConversationResponse(
    palace,
    "Where is it implemented?",
    history,
    { stream: true }
  );

  // Add to history
  history.push({ role: "user", content: "Where is it implemented?" });
  history.push({ role: "assistant", content: response2 });

  // Turn 3 - Another follow-up
  console.log("\n" + "=" .repeat(70));
  console.log("USER: What methods does it have?");
  console.log("=" .repeat(70) + "\n");

  await llmService.generateConversationResponse(
    palace,
    "What methods does it have?",
    history,
    { stream: true }
  );

  console.log("\n\n✅ Conversation completed!");
  console.log(`📊 Total turns: 3`);
  console.log(`📝 History size: ${history.length} messages`);
}

testConversation();
