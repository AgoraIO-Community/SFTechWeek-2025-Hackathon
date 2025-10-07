import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      // Mock response for development
      return NextResponse.json({
        audio_url: '/api/tts/mock-audio',
        duration: text.length * 0.1, // Rough estimate
        message: 'ElevenLabs API key not configured - using mock response'
      });
    }

    const voiceId = voice_id || process.env.ELEVENLABS_VOICE_ID || 'default-voice';

    // ElevenLabs TTS API call
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!ttsResponse.ok) {
      throw new Error(`ElevenLabs API error: ${ttsResponse.statusText}`);
    }

    // Convert audio to base64 or save to storage
    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      audio_data: audioBase64,
      audio_url: `data:audio/mpeg;base64,${audioBase64}`,
      duration: text.length * 0.1,
      format: 'mp3'
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}

// Mock audio endpoint for development
export async function GET(request: NextRequest) {
  // Return a simple audio tone for testing
  return new NextResponse('Mock audio data - implement actual audio generation', {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
}