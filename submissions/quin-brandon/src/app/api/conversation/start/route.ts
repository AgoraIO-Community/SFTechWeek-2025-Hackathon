import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

/**
 * Start Agora Conversational AI Session
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, channelName } = body;

    if (!channelName) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    // Get configuration
    const config = {
      appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      appCertificate: process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE || process.env.AGORA_APP_CERTIFICATE!,
      customerId: process.env.NEXT_PUBLIC_AGORA_CUSTOMER_ID!,
      customerSecret: process.env.NEXT_PUBLIC_AGORA_CUSTOMER_SECRET || process.env.AGORA_CUSTOMER_SECRET!,
      agoraBaseUrl: process.env.NEXT_PUBLIC_AGORA_CONVO_AI_BASE_URL || 'https://api.agora.io/api/conversational-ai-agent/v2/projects',
      agentUid: process.env.NEXT_PUBLIC_AGENT_UID || 'MarketAgent',
    };

    // Validate configuration
    if (!config.appId || !config.appCertificate || !config.customerId || !config.customerSecret) {
      return NextResponse.json(
        { error: 'Missing Agora configuration. Check your .env.local file.' },
        { status: 500 }
      );
    }

    // Generate RTC tokens
    const timestamp = Math.floor(Date.now() / 1000);
    const expirationTime = timestamp + 3600; // 1 hour
    
    // Token for the AI agent
    const agentToken = RtcTokenBuilder.buildTokenWithUid(
      config.appId,
      config.appCertificate,
      channelName,
      config.agentUid,
      RtcRole.PUBLISHER,
      expirationTime,
      timestamp
    );

    // Token for the user
    const userToken = RtcTokenBuilder.buildTokenWithUid(
      config.appId,
      config.appCertificate,
      channelName,
      userId || 0,
      RtcRole.PUBLISHER,
      expirationTime,
      timestamp
    );

    // Generate unique conversation name
    const conversationName = `market-avatar-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Get your LLM endpoint URL (deployed or ngrok)
    const llmEndpointUrl = process.env.NEXT_PUBLIC_LLM_ENDPOINT_URL || 
                          `${request.nextUrl.origin}/api/llm/chat`;

    console.log('[Conversation Start] Configuration:', {
      channelName,
      conversationName,
      llmEndpointUrl,
      agentUid: config.agentUid,
    });

    // Build Agora Conversational AI request
    const agoraRequest = {
      name: conversationName,
      properties: {
        channel: channelName,
        token: agentToken,
        agent_rtc_uid: config.agentUid,
        remote_rtc_uids: ["*"],  // Listen to all users in the channel
        enable_string_uid: /[a-zA-Z]/.test(config.agentUid),
        idle_timeout: 60,
        
        // ASR Configuration (Speech-to-Text)
        asr: {
          language: 'en-US',
          task: 'conversation',
        },
        
        // LLM Configuration (points to your Groq endpoint)
        llm: {
          url: llmEndpointUrl,
          api_key: process.env.LLM_API_KEY || '',
          system_messages: [
            {
              role: 'system',
              content: `You are a professional AI market analyst assistant. 
You provide real-time market insights, stock analysis, and financial information.
Keep responses concise (under 30 seconds when spoken), professional, and actionable.
When discussing stocks, always mention the ticker symbol.
Be conversational but authoritative. Speak clearly and at a moderate pace.`,
            },
          ],
          greeting_message: 'Hello! I\'m your AI market analyst. How can I help you with market insights today?',
          failure_message: 'I apologize, I\'m having trouble processing that. Could you rephrase?',
          max_history: 10,
          params: {
            model: process.env.NEXT_PUBLIC_LLM_MODEL || 'llama-3.3-70b-versatile',
            max_tokens: 512,
            temperature: 0.7,
            top_p: 0.95,
          },
        },
        
        // VAD Configuration (Voice Activity Detection)
        vad: {
          silence_duration_ms: 480,
          speech_duration_ms: 15000,
          threshold: 0.5,
          interrupt_duration_ms: 160,
          prefix_padding_ms: 300,
        },
        
        // TTS Configuration (ElevenLabs)
        tts: {
          vendor: 'elevenlabs',
          params: {
            key: process.env.ELEVENLABS_API_KEY || '',
            model_id: process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5',
            voice_id: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
          },
        },
      },
    };

    // Call Agora Conversational AI API
    const agoraUrl = `${config.agoraBaseUrl}/${config.appId}/join`;
    
    console.log('[Conversation Start] Calling Agora API...', {
      url: agoraUrl,
      customerId: config.customerId,
      requestBody: JSON.stringify(agoraRequest, null, 2),
    });

    const response = await fetch(agoraUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${config.customerId}:${config.customerSecret}`
        ).toString('base64')}`,
      },
      body: JSON.stringify(agoraRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Conversation Start] Agora API error:', {
        url: agoraUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });
      return NextResponse.json(
        { error: `Failed to start conversation: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Conversation Start] Success!', data);

    // Extract agent_id from Agora response
    const agentId = data.agent_id || conversationName;

    return NextResponse.json({
      success: true,
      conversationName,
      channelName,
      agentUid: config.agentUid,
      appId: config.appId,
      userToken,
      userId: userId || 0,
      agentId,  // This is what we need for stopping
      data,
    });

  } catch (error) {
    console.error('[Conversation Start] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to start conversation',
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  const config = {
    hasAppId: !!process.env.NEXT_PUBLIC_AGORA_APP_ID,
    hasAppCertificate: !!process.env.AGORA_APP_CERTIFICATE,
    hasCustomerId: !!process.env.NEXT_PUBLIC_AGORA_CUSTOMER_ID,
    hasCustomerSecret: !!process.env.AGORA_CUSTOMER_SECRET,
    hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
    hasGroqKey: !!process.env.LLM_API_KEY,
  };

  const allConfigured = Object.values(config).every(Boolean);

  return NextResponse.json({
    status: allConfigured ? 'ok' : 'incomplete',
    service: 'Agora Conversational AI',
    configured: allConfigured,
    details: config,
  });
}

