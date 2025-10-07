import { NextRequest, NextResponse } from 'next/server';
import { nluService } from '../../../lib/services/NLUService';

export async function POST(request: NextRequest) {
  try {
    const { text, user_id, action, intent, slots, market_data } = await request.json();

    if (action === 'process') {
      // Process user input to understand intent
      if (!text) {
        return NextResponse.json({ error: 'Text is required for processing' }, { status: 400 });
      }

      const nluResponse = await nluService.processText(text, user_id);
      return NextResponse.json(nluResponse);
    }

    if (action === 'generate_response') {
      // Generate AI response based on intent and market data
      if (!intent) {
        return NextResponse.json({ error: 'Intent is required for response generation' }, { status: 400 });
      }

      const response = await nluService.generateResponse(intent, slots || {}, market_data);
      return NextResponse.json({ response });
    }

    // Default: process the text
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const nluResponse = await nluService.processText(text, user_id);
    return NextResponse.json(nluResponse);

  } catch (error) {
    console.error('NLU API error:', error);
    return NextResponse.json({ error: 'Failed to process natural language' }, { status: 500 });
  }
}