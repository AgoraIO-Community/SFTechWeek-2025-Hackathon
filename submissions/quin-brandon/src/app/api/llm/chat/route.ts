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
    const { messages, temperature = 0.7, max_tokens = 512, top_p = 0.95 } = body;

    console.log('[Custom LLM] Request from Agora:', {
      messageCount: messages.length,
      lastUserMessage: messages.filter(m => m.role === 'user').pop()?.content?.substring(0, 100),
    });

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

    // Call Groq LLM
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

    console.log('[Custom LLM] Response generated:', {
      preview: assistantMessage.substring(0, 100) + '...',
      tokens: groqData.usage,
    });

    // Return in format expected by Agora
    return NextResponse.json({
      choices: [
        {
          message: {
            role: 'assistant',
            content: assistantMessage,
          },
          finish_reason: 'stop',
        },
      ],
      usage: groqData.usage,
    });

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

