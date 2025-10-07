'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser,
  IRemoteAudioTrack
} from 'agora-rtc-sdk-ng';

interface ConversationState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  conversationName: string | null;
  channelName: string | null;
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>({
    isActive: false,
    isLoading: false,
    error: null,
    conversationName: null,
    channelName: null,
  });

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const conversationNameRef = useRef<string | null>(null);

  /**
   * Start a conversation
   */
  const startConversation = useCallback(async (userId?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Generate unique channel name
      const channelName = `market-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      console.log('[useConversation] Starting conversation...', { channelName });

      // Call backend to start Agora Conversational AI session
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId || `user-${Date.now()}`,
          channelName 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start conversation');
      }

      const data = await response.json();
      console.log('[useConversation] Backend response:', data);

      conversationNameRef.current = data.conversationName;

      // Dynamically import Agora RTC SDK (client-side only)
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      
      // Create Agora RTC client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Set up event listeners
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        console.log('[useConversation] User published:', user.uid, mediaType);
        
        if (mediaType === 'audio') {
          await client.subscribe(user, 'audio');
          const remoteAudioTrack = user.audioTrack as IRemoteAudioTrack;
          remoteAudioTrack?.play();
          console.log('[useConversation] Playing remote audio');
        }
      });

      client.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
        console.log('[useConversation] User unpublished:', user.uid);
      });

      client.on('connection-state-change', (curState, prevState) => {
        console.log('[useConversation] Connection state:', prevState, '->', curState);
      });

      // Join the channel with user token
      await client.join(
        data.appId,
        channelName,
        data.userToken,
        data.userId
      );

      console.log('[useConversation] Joined channel successfully');

      // Create and publish microphone track
      const microphoneTrack = await AgoraRTC!.createMicrophoneAudioTrack({
        encoderConfig: {
          sampleRate: 48000,
          stereo: false,
          sampleSize: 16,
        },
        AEC: true, // Acoustic Echo Cancellation
        ANS: true, // Automatic Noise Suppression  
        AGC: true, // Automatic Gain Control
      });

      await client.publish([microphoneTrack]);
      console.log('[useConversation] Published microphone track');

      setState({
        isActive: true,
        isLoading: false,
        error: null,
        conversationName: data.conversationName,
        channelName: channelName,
      });

    } catch (error) {
      console.error('[useConversation] Error starting conversation:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation',
      }));
    }
  }, []);

  /**
   * Stop the conversation
   */
  const stopConversation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      console.log('[useConversation] Stopping conversation...');

      // Stop Agora Conversational AI session
      if (conversationNameRef.current) {
        await fetch('/api/conversation/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            conversationName: conversationNameRef.current 
          }),
        });
      }

      // Leave RTC channel and cleanup
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }

      conversationNameRef.current = null;

      setState({
        isActive: false,
        isLoading: false,
        error: null,
        conversationName: null,
        channelName: null,
      });

      console.log('[useConversation] Conversation stopped');

    } catch (error) {
      console.error('[useConversation] Error stopping conversation:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to stop conversation',
      }));
    }
  }, []);

  /**
   * Toggle conversation (start/stop)
   */
  const toggleConversation = useCallback(async () => {
    if (state.isActive) {
      await stopConversation();
    } else {
      await startConversation();
    }
  }, [state.isActive, startConversation, stopConversation]);

  return {
    isActive: state.isActive,
    isLoading: state.isLoading,
    error: state.error,
    conversationName: state.conversationName,
    channelName: state.channelName,
    startConversation,
    stopConversation,
    toggleConversation,
  };
}

