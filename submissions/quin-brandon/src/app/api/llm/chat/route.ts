import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom LLM Endpoint for Agora Conversational AI
 * This endpoint receives requests from Agora and calls Groq LLM
 */

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMRequest {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: LLMRequest = await request.json();
    
    console.log('[Custom LLM] Full incoming request:', JSON.stringify(body, null, 2));
    
    // Extract params including stream flag
    const { messages, temperature = 0.7, max_tokens = 512, top_p = 0.95, stream = false } = body;

    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    console.log('[Custom LLM] Request from Agora:', {
      messageCount: messages.length,
      lastUserMessage: lastUserMessage.substring(0, 100),
      streamRequested: stream,
    });

    // Log user message to transcript store (for live captions)
    // Extract conversationId from headers if available
    const conversationId = request.headers.get('x-conversation-id') || 'default';
    if (lastUserMessage && lastUserMessage.trim()) {
      try {
        // Use localhost for internal API calls to avoid SSL issues with ngrok
        const internalUrl = process.env.NEXT_PUBLIC_INTERNAL_URL || 'http://localhost:3000';
        await fetch(`${internalUrl}/api/conversation/transcripts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            type: 'user',
            text: lastUserMessage,
          }),
        });
      } catch (e) {
        console.error('[Custom LLM] Failed to log user transcript:', e);
      }
    }

    // Get Groq configuration
    const groqApiKey = process.env.LLM_API_KEY;
    const groqModel = process.env.NEXT_PUBLIC_LLM_MODEL || 'llama-3.3-70b-versatile';

    if (!groqApiKey) {
      console.error('[Custom LLM] Missing Groq API key');
      return NextResponse.json(
        { error: 'LLM not configured' },
        { status: 500 }
      );
    }

    // If Agora requests streaming, return SSE format
    if (stream) {
      console.log('[Custom LLM] Streaming response requested - will return SSE');

      // Call Groq WITHOUT streaming, then convert to SSE
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: messages,
          temperature: temperature,
          max_tokens: max_tokens,
          top_p: top_p,
          stream: false,
        }),
      });

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.error('[Custom LLM] Groq error:', errorText);
        return NextResponse.json(
          { error: 'LLM request failed' },
          { status: groqResponse.status }
        );
      }

      const groqData = await groqResponse.json();
      const assistantMessage = groqData.choices[0]?.message?.content || 
                              'I apologize, but I couldn\'t process that request.';

      console.log('[Custom LLM] Generated response, converting to SSE:', {
        preview: assistantMessage.substring(0, 100) + '...',
      });

      // Log AI response to transcript store
      if (assistantMessage && assistantMessage.trim()) {
        try {
          const internalUrl = process.env.NEXT_PUBLIC_INTERNAL_URL || 'http://localhost:3000';
          await fetch(`${internalUrl}/api/conversation/transcripts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId,
              type: 'ai',
              text: assistantMessage,
            }),
          });
        } catch (e) {
          console.error('[Custom LLM] Failed to log AI transcript:', e);
        }
      }

      // Create SSE stream
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        start(controller) {
          // Send the message as a single delta chunk
          const chunk = {
            choices: [{
              index: 0,
              delta: {
                role: "assistant",
                content: assistantMessage
              },
              finish_reason: null
            }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

          // Send finish chunk
          const finishChunk = {
            choices: [{
              index: 0,
              delta: {},
              finish_reason: "stop"
            }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`));

          // Send DONE
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          
          console.log('[Custom LLM] SSE stream completed');
          controller.close();
        }
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (fallback)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
        top_p: top_p,
        stream: false,  // We return non-streaming to Agora, it handles streaming
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('[Custom LLM] Groq error:', errorText);
      return NextResponse.json(
        { error: 'LLM request failed' },
        { status: groqResponse.status }
      );
    }

    const groqData = await groqResponse.json();
    const assistantMessage = groqData.choices[0]?.message?.content || 
                            'I apologize, but I couldn\'t process that request.';

    console.log('[Custom LLM] Response generated:', {
      preview: assistantMessage.substring(0, 100) + '...',
      tokens: groqData.usage,
    });

    // Log AI response to transcript store (non-streaming path)
    if (assistantMessage && assistantMessage.trim()) {
      try {
        const internalUrl = process.env.NEXT_PUBLIC_INTERNAL_URL || 'http://localhost:3000';
        await fetch(`${internalUrl}/api/conversation/transcripts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            type: 'ai',
            text: assistantMessage,
          }),
        });
      } catch (e) {
        console.error('[Custom LLM] Failed to log AI transcript:', e);
      }
    }

    // Return minimal OpenAI-compatible format (no streaming, no extra fields)
    const response = {
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: assistantMessage
        },
        finish_reason: "stop"
      }]
    };

    console.log('[Custom LLM] Returning response:', JSON.stringify(response));

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Custom LLM] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  const hasGroqKey = !!process.env.LLM_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    service: 'Custom LLM for Agora Conversational AI',
    configured: hasGroqKey,
    model: process.env.NEXT_PUBLIC_LLM_MODEL || 'llama-3.3-70b-versatile',
  });
}

