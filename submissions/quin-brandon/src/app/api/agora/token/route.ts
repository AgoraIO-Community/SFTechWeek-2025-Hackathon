import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

/**
 * Agora RTC Token Generation API
 * 
 * Generates secure tokens for Agora RTC connections
 * This must run server-side to keep the certificate secret
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelName, uid, role = 'publisher' } = body;

    // Validate inputs
    if (!channelName || typeof channelName !== 'string') {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    if (uid === undefined || typeof uid !== 'number') {
      return NextResponse.json(
        { error: 'UID is required and must be a number' },
        { status: 400 }
      );
    }

    // Get environment variables
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error('Missing Agora credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Token configuration
    const privilegeExpireTime = 3600; // 1 hour in seconds
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expirationTimestamp = currentTimestamp + privilegeExpireTime;

    // Determine role
    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      expirationTimestamp,
      currentTimestamp
    );

    // Return token and metadata
    return NextResponse.json({
      token,
      appId,
      channelName,
      uid,
      expiresAt: expirationTimestamp * 1000, // Convert to milliseconds
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const hasCertificate = !!process.env.AGORA_APP_CERTIFICATE;

  return NextResponse.json({
    status: 'ok',
    configured: !!appId && hasCertificate,
    appId: appId || 'not configured',
  });
}

