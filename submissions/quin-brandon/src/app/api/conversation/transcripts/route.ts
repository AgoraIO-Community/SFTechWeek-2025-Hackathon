import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory store for conversation transcripts
 * In production, you'd use Redis or a database
 */
const transcriptStore = new Map<string, Array<{
  type: 'user' | 'ai';
  text: string;
  timestamp: number;
}>>();

/**
 * GET - Fetch transcripts for a conversation
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId required' },
      { status: 400 }
    );
  }

  const transcripts = transcriptStore.get(conversationId) || [];
  
  return NextResponse.json({
    conversationId,
    transcripts,
    count: transcripts.length,
  });
}

/**
 * POST - Add a transcript entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, type, text } = body;

    if (!conversationId || !type || !text) {
      return NextResponse.json(
        { error: 'conversationId, type, and text required' },
        { status: 400 }
      );
    }

    // Get existing transcripts or create new array
    const transcripts = transcriptStore.get(conversationId) || [];
    
    // Add new transcript
    transcripts.push({
      type,
      text,
      timestamp: Date.now(),
    });

    // Store back (keep last 100 messages)
    transcriptStore.set(
      conversationId,
      transcripts.slice(-100)
    );

    console.log(`[Transcripts] Added ${type} message for ${conversationId}:`, text.substring(0, 50));

    return NextResponse.json({
      success: true,
      conversationId,
      messageCount: transcripts.length,
    });
  } catch (error) {
    console.error('[Transcripts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear transcripts for a conversation
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId required' },
      { status: 400 }
    );
  }

  transcriptStore.delete(conversationId);

  console.log(`[Transcripts] Cleared transcripts for ${conversationId}`);

  return NextResponse.json({ success: true });
}

