import { NextRequest, NextResponse } from 'next/server';
import { MarketService } from '@/lib/services/MarketService';

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

// Market data tools for function calling
const marketTools = [
  {
    type: "function",
    function: {
      name: "get_stock_quote",
      description: "Get real-time stock price, change, and basic metrics for a single stock",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Stock ticker symbol (e.g., AAPL, MSFT, TSLA)"
          }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_market_news",
      description: "Get latest financial news headlines",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Company name or market topic to search news for"
          },
          limit: {
            type: "number",
            description: "Number of articles to return (default 5, max 10)"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_stocks",
      description: "Compare multiple stocks side by side",
      parameters: {
        type: "object",
        properties: {
          symbols: {
            type: "array",
            items: { type: "string" },
            description: "Array of stock symbols to compare (e.g., ['AAPL', 'MSFT'])"
          }
        },
        required: ["symbols"]
      }
    }
  }
];

// Available functions for execution
const availableFunctions = {
  get_stock_quote: async (args: { symbol: string }) => {
    const marketService = new MarketService();
    const quotes = await marketService.getQuotes([args.symbol.toUpperCase()]);
    if (quotes.length === 0) {
      return `No data found for symbol ${args.symbol}`;
    }
    const quote = quotes[0];
    return {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      change_percent: quote.change_percent,
      volume: quote.volume,
      timestamp: quote.timestamp
    };
  },

  get_market_news: async (args: { query: string; limit?: number }) => {
    const marketService = new MarketService();
    const limit = Math.min(args.limit || 5, 10); // Cap at 10
    const news = await marketService.getMarketNews(undefined, limit);
    return {
      query: args.query,
      count: news.length,
      headlines: news.map(item => ({
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        published_at: item.published_at
      }))
    };
  },

  compare_stocks: async (args: { symbols: string[] }) => {
    const marketService = new MarketService();
    const symbols = args.symbols.map(s => s.toUpperCase());
    const quotes = await marketService.getQuotes(symbols);
    return {
      comparison: quotes.map(quote => ({
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        change_percent: quote.change_percent,
        volume: quote.volume
      }))
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: LLMRequest = await request.json();
    
    console.log('[Custom LLM] Full incoming request:', JSON.stringify(body, null, 2));
    
    // Extract params including stream flag
    const { messages, temperature = 0.7, max_tokens = 512, top_p = 0.95, stream = false } = body;

    console.log('[Custom LLM] Request from Agora:', {
      messageCount: messages.length,
      lastUserMessage: messages.filter(m => m.role === 'user').pop()?.content?.substring(0, 100),
      streamRequested: stream,
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

    // Add tools to Groq request for function calling
    const groqRequestBody = {
      model: groqModel,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      top_p: top_p,
      tools: marketTools,
      tool_choice: "auto",
      stream: false
    };

    console.log('[Custom LLM] Sending request to Groq with tools');

    // If Agora requests streaming, handle function calls then stream result
    if (stream) {
      console.log('[Custom LLM] Streaming response requested - handling function calls first');

      // Step 1: Call Groq to detect function calls (non-streaming)
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify(groqRequestBody),
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
      const responseMessage = groqData.choices[0]?.message;
      let finalMessage = '';

      // Step 2: Check if function calls are needed
      if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        console.log('[Custom LLM] Function calls detected in streaming mode:', responseMessage.tool_calls.length);

        // Execute function calls internally
        const updatedMessages = [...messages, {
          role: "assistant",
          tool_calls: responseMessage.tool_calls
        }];

        // Execute each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          console.log(`[Custom LLM] Executing function in streaming: ${functionName}`);

          if (functionName in availableFunctions) {
            try {
              const functionArgs = JSON.parse(toolCall.function.arguments);
              const functionResponse = await availableFunctions[functionName as keyof typeof availableFunctions](functionArgs);

              updatedMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: functionName,
                content: JSON.stringify(functionResponse)
              });

              console.log(`[Custom LLM] Function ${functionName} executed successfully in streaming`);
            } catch (error) {
              console.error(`[Custom LLM] Error executing function ${functionName} in streaming:`, error);
              updatedMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: functionName,
                content: JSON.stringify({ error: `Failed to execute ${functionName}` })
              });
            }
          }
        }

        // Get final response after function execution
        console.log('[Custom LLM] Getting final response after function calls for streaming');
        const secondGroqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages: updatedMessages,
            temperature: temperature,
            max_tokens: max_tokens,
            top_p: top_p,
            stream: false
          }),
        });

        if (!secondGroqResponse.ok) {
          const errorText = await secondGroqResponse.text();
          console.error('[Custom LLM] Second Groq call error in streaming:', errorText);
          finalMessage = 'I apologize, but I couldn\'t process that request.';
        } else {
          const secondGroqData = await secondGroqResponse.json();
          finalMessage = secondGroqData.choices[0]?.message?.content ||
                        'I apologize, but I couldn\'t process that request.';
        }
      } else {
        // No function calls needed
        finalMessage = responseMessage?.content || 'I apologize, but I couldn\'t process that request.';
      }

      console.log('[Custom LLM] Final message for streaming:', {
        preview: finalMessage.substring(0, 100) + '...',
      });

      // Step 3: Stream the final result
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        start(controller) {
          // Send the complete message as a single delta chunk
          const chunk = {
            choices: [{
              index: 0,
              delta: {
                role: "assistant",
                content: finalMessage
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

          console.log('[Custom LLM] SSE stream with function calls completed');
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

    // Non-streaming response with function calling support
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify(groqRequestBody),
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
    const responseMessage = groqData.choices[0]?.message;

    // Check if the model wants to call any tools
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      console.log('[Custom LLM] Tool calls detected:', responseMessage.tool_calls.length);

      // Append the assistant message with tool calls to the conversation
      const updatedMessages = [...messages, {
        role: "assistant",
        tool_calls: responseMessage.tool_calls
      }];

      // Execute each tool call
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        console.log(`[Custom LLM] Executing function: ${functionName}`);

        if (functionName in availableFunctions) {
          try {
            const functionArgs = JSON.parse(toolCall.function.arguments);
            const functionResponse = await availableFunctions[functionName as keyof typeof availableFunctions](functionArgs);

            // Add the tool response to the conversation
            updatedMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify(functionResponse)
            });

            console.log(`[Custom LLM] Function ${functionName} executed successfully`);
          } catch (error) {
            console.error(`[Custom LLM] Error executing function ${functionName}:`, error);
            updatedMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify({ error: `Failed to execute ${functionName}` })
            });
          }
        }
      }

      // Make a second call to get the final response
      console.log('[Custom LLM] Making second call with tool results');
      const secondGroqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: updatedMessages,
          temperature: temperature,
          max_tokens: max_tokens,
          top_p: top_p,
          stream: false
        }),
      });

      if (!secondGroqResponse.ok) {
        const errorText = await secondGroqResponse.text();
        console.error('[Custom LLM] Second Groq call error:', errorText);
        return NextResponse.json(
          { error: 'LLM second request failed' },
          { status: secondGroqResponse.status }
        );
      }

      const secondGroqData = await secondGroqResponse.json();
      const finalMessage = secondGroqData.choices[0]?.message?.content ||
                          'I apologize, but I couldn\'t process that request.';

      console.log('[Custom LLM] Final response with tool data:', {
        preview: finalMessage.substring(0, 100) + '...',
        tokens: secondGroqData.usage,
      });

      return NextResponse.json({
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: finalMessage
          },
          finish_reason: "stop"
        }]
      });
    }

    // No tool calls - return the response directly
    const assistantMessage = responseMessage?.content ||
                            'I apologize, but I couldn\'t process that request.';

    console.log('[Custom LLM] Direct response (no tools):', {
      preview: assistantMessage.substring(0, 100) + '...',
      tokens: groqData.usage,
    });

    return NextResponse.json({
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: assistantMessage
        },
        finish_reason: "stop"
      }]
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

