import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log('Testing with text:', text);

    // Step 1: Process text with Groq NLU
    const nluResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/nlu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, action: 'process' })
    });

    if (!nluResponse.ok) {
      throw new Error('NLU processing failed');
    }

    const nluData = await nluResponse.json();
    console.log('NLU Response:', nluData);

    // Step 2: Get market data based on intent
    let marketData = null;

    if (nluData.intent?.type === 'market_brief') {
      const marketResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'market_brief' })
      });

      if (marketResponse.ok) {
        marketData = await marketResponse.json();
      }
    } else if (nluData.slots?.tickers?.length > 0) {
      const marketResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: nluData.slots.tickers,
          intent: nluData.intent
        })
      });

      if (marketResponse.ok) {
        marketData = await marketResponse.json();
      }
    }

    console.log('Market Data:', marketData);

    // Step 3: Generate response with Groq
    const responseGeneration = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/nlu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '',
        action: 'generate_response',
        intent: nluData.intent,
        slots: nluData.slots,
        market_data: marketData
      })
    });

    let aiResponse = 'I have the information you requested.';
    if (responseGeneration.ok) {
      const responseData = await responseGeneration.json();
      aiResponse = responseData.response || aiResponse;
    }

    console.log('AI Response:', aiResponse);

    return NextResponse.json({
      success: true,
      flow: {
        user_input: text,
        nlu_result: nluData,
        market_data: marketData,
        ai_response: aiResponse
      }
    });

  } catch (error) {
    console.error('Test flow error:', error);
    return NextResponse.json({
      error: 'Test flow failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint ready',
    endpoints: {
      'POST /api/test': 'Test full voice → AI → market data flow',
      'POST /api/nlu': 'Natural language understanding',
      'POST /api/market': 'Market data retrieval'
    }
  });
}