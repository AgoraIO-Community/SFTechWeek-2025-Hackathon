/**
 * Simple test: Verify Groq API connection with streaming
 */

import Groq from "groq-sdk";

async function testGroq() {
  console.log("🧪 Testing Groq API connection...\n");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("❌ GROQ_API_KEY environment variable not set");
    console.log("   Get your key at: https://console.groq.com/keys");
    process.exit(1);
  }

  const groq = new Groq({ apiKey });

  console.log("📤 Sending test message with streaming...\n");

  const stream = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Say 'Hello from Groq!' in a friendly way.",
      },
    ],
    model: "llama-3.3-70b-versatile",
    stream: true,
  });

  console.log("📥 Response:\n");

  // Process streaming response
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    process.stdout.write(content);
  }

  console.log("\n\n✅ Groq streaming test completed!\n");
}

testGroq().catch((error) => {
  console.error("\n❌ Error:", error);
  if (error instanceof Error) {
    console.error("   Message:", error.message);
  }
  process.exit(1);
});
