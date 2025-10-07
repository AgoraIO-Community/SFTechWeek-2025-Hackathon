import { NextRequest, NextResponse } from 'next/server';

/**
 * Stop Agora Conversational AI Session
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationName } = body;

    if (!conversationName) {
      return NextResponse.json(
        { error: 'Conversation name is required' },
        { status: 400 }
      );
    }

    // Get configuration
    const config = {
      appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      customerId: process.env.NEXT_PUBLIC_AGORA_CUSTOMER_ID!,
      customerSecret: process.env.NEXT_PUBLIC_AGORA_CUSTOMER_SECRET || process.env.AGORA_CUSTOMER_SECRET!,
      agoraBaseUrl: process.env.NEXT_PUBLIC_AGORA_CONVO_AI_BASE_URL || 'https://api.agora.io/api/conversational-ai-agent/v2/projects',
    };

    if (!config.appId || !config.customerId || !config.customerSecret) {
      return NextResponse.json(
        { error: 'Missing Agora configuration' },
        { status: 500 }
      );
    }

    console.log('[Conversation Stop] Stopping conversation:', conversationName);

    // Call Agora API to stop the conversation
    const agoraUrl = `${config.agoraBaseUrl}/${config.appId}/leave`;
    
    const response = await fetch(agoraUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${config.customerId}:${config.customerSecret}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        name: conversationName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Conversation Stop] Error:', {
        status: response.status,
        body: errorText,
      });
      
      // Don't fail if already stopped
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          message: 'Conversation already stopped',
        });
      }

      return NextResponse.json(
        { error: `Failed to stop conversation: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Conversation Stop] Success');

    return NextResponse.json({
      success: true,
      message: 'Conversation stopped successfully',
      data,
    });

  } catch (error) {
    console.error('[Conversation Stop] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to stop conversation',
      },
      { status: 500 }
    );
  }
}

