import { NextResponse } from "next/server";
import { GitHubFileSystemAdapter, LLMService, ResponseParser } from "@principal-ade/ai-brain";
import { MemoryPalace } from "@a24z/core-library";
import { palaceCache, adapterCache } from "@/lib/cache";

export async function POST(request) {
  try {
    const { message, conversationHistory = [], sessionId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get API keys from environment
    const githubToken = process.env.GITHUB_TOKEN;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!githubToken || !groqApiKey) {
      return NextResponse.json(
        { error: "Missing required API keys (GITHUB_TOKEN or GROQ_API_KEY)" },
        { status: 500 }
      );
    }

    // Repository configuration
    const owner = "a24z-ai";
    const repo = "core-library";
    const branch = "main";
    const cacheKey = `${owner}/${repo}/${branch}/${sessionId}`;

    // Get or create MemoryPalace instance
    let palace = palaceCache.get(cacheKey);
    let fsAdapter = adapterCache.get(cacheKey);

    if (!palace || !fsAdapter) {
      console.log(`Loading repository: ${owner}/${repo} for session ${sessionId}...`);

      fsAdapter = new GitHubFileSystemAdapter(owner, repo, branch, githubToken);
      await fsAdapter.prefetchAlexandriaFiles();

      const repoPath = fsAdapter.getGitHubPath();
      palace = new MemoryPalace(repoPath, fsAdapter);

      // Cache for this session
      palaceCache.set(cacheKey, palace);
      adapterCache.set(cacheKey, fsAdapter);

      const views = palace.listViews();
      console.log(`Loaded ${views.length} codebase views`);
    } else {
      console.log(`Using cached MemoryPalace for session ${sessionId}`);
    }

    // Initialize LLM service
    const llmService = new LLMService({ apiKey: groqApiKey });

    // Generate streaming response using v0.3.1 view-aware method
    console.log(`Generating view-aware response for: "${message}"`);
    console.log(`Conversation history length: ${conversationHistory.length}`);

    // Create a ReadableStream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use the NEW view-aware streaming method from v0.3.1
          const { response, intent } = await llmService.generateViewAwareResponse(
            palace,
            fsAdapter, // ← Required parameter in v0.3.1
            message,
            conversationHistory,
            {
              temperature: 0.7,
              maxTokens: 2000,
              stream: true, // Enable streaming
            }
          );

          // Send intent information first (optional metadata)
          controller.enqueue(encoder.encode(JSON.stringify({
            metadata: {
              type: intent.type,
              relevantViews: intent.relevantViews,
              filesLoaded: intent.relevantFiles?.length || 0,
              version: 'v0.3.1'
            }
          }) + '\n'));

          // Accumulate text for file reference extraction
          let accumulatedText = '';
          let lastExtractedLength = 0;

          // Stream each chunk to the client
          for await (const chunk of response) {
            accumulatedText += chunk;

            // Send the content chunk
            const data = JSON.stringify({ content: chunk }) + '\n';
            controller.enqueue(encoder.encode(data));

            // Periodically extract file references (every ~200 chars)
            if (accumulatedText.length - lastExtractedLength > 200) {
              const previousText = accumulatedText.substring(0, lastExtractedLength);
              const newFileRefs = ResponseParser.extractFileReferencesIncremental(
                previousText,
                accumulatedText
              );

              if (newFileRefs.length > 0) {
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'file_references',
                  references: newFileRefs
                }) + '\n'));
              }

              lastExtractedLength = accumulatedText.length;
            }
          }

          // Final file reference extraction
          const allFileRefs = ResponseParser.extractFileReferences(accumulatedText);
          if (allFileRefs.length > 0) {
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'file_references_final',
              references: allFileRefs
            }) + '\n'));
          }

          // Send completion signal
          controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
