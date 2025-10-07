import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, action } = await request.json();

    const heygenApiKey = process.env.HEYGEN_API_KEY;

    if (!heygenApiKey) {
      // Mock response for development
      return NextResponse.json({
        session_id: `mock-session-${Date.now()}`,
        rtc_token: 'mock-rtc-token',
        avatar_url: '/placeholder-avatar.mp4',
        status: 'ready',
        message: 'HeyGen API key not configured - using mock response'
      });
    }

    if (action === 'create_session') {
      // Create HeyGen avatar session
      const sessionResponse = await fetch('https://api.heygen.com/v1/streaming.create_token', {
        method: 'POST',
        headers: {
          'X-Api-Key': heygenApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quality: 'high',
          avatar_name: process.env.HEYGEN_AVATAR_ID || 'default_avatar',
          voice: {
            voice_id: 'default_voice'
          }
        })
      });

      if (!sessionResponse.ok) {
        throw new Error(`HeyGen API error: ${sessionResponse.statusText}`);
      }

      const sessionData = await sessionResponse.json();

      return NextResponse.json({
        session_id: sessionData.session_id,
        rtc_token: sessionData.token,
        avatar_url: sessionData.avatar_url,
        status: 'ready'
      });
    }

    if (action === 'send_text') {
      const { session_id, text } = await request.json();

      // Send text to HeyGen avatar
      const talkResponse = await fetch('https://api.heygen.com/v1/streaming.task', {
        method: 'POST',
        headers: {
          'X-Api-Key': heygenApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id,
          text,
          task_type: 'talk'
        })
      });

      if (!talkResponse.ok) {
        throw new Error(`HeyGen talk API error: ${talkResponse.statusText}`);
      }

      const talkData = await talkResponse.json();

      return NextResponse.json({
        task_id: talkData.task_id,
        status: 'processing'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Avatar API error:', error);
    return NextResponse.json({ error: 'Failed to manage avatar session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  // Mock session status
  return NextResponse.json({
    session_id: sessionId,
    status: 'active',
    duration: Math.floor(Math.random() * 300),
    avatar_state: 'ready'
  });
}