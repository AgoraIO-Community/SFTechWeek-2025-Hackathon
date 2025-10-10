"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook for real-time streaming text-to-speech using ElevenLabs WebSocket API
 * Streams text chunks as they arrive and plays audio with minimal latency
 */
export function useElevenLabsWebSocketTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const textBufferRef = useRef("");
  const bufferTimeoutRef = useRef(null);

  // Initialize Web Audio API
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000, // ElevenLabs outputs 24kHz audio
      });
    }
    return audioContextRef.current;
  }, []);

  // Play audio chunks from queue with seamless playback
  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current) return;

    isPlayingRef.current = true;
    const audioContext = audioContextRef.current;

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();

      try {
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        currentSourceRef.current = source;

        // Schedule playback to ensure seamless transitions
        const currentTime = audioContext.currentTime;
        const startTime = Math.max(currentTime, nextPlayTimeRef.current);

        source.start(startTime);
        nextPlayTimeRef.current = startTime + audioBuffer.duration;

        // Wait for this chunk to finish
        await new Promise((resolve) => {
          source.onended = resolve;
        });
      } catch (error) {
        console.error("Error playing audio chunk:", error);
      }
    }

    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;

    // Update isSpeaking to false when queue is empty and playback done
    setIsSpeaking(false);
    console.log("🔊 Audio playback complete");
  }, []);

  // Start WebSocket connection and streaming session
  const startStreaming = useCallback((options = {}) => {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error("ElevenLabs API key not configured");
      setIsSupported(false);
      return null;
    }

    const voiceId = options.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
    const modelId = options.modelId || "eleven_turbo_v2_5"; // Use turbo for lowest latency

    // Initialize audio context
    const audioContext = initAudioContext();
    audioQueueRef.current = [];
    nextPlayTimeRef.current = 0;

    // Create WebSocket connection
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${modelId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("ElevenLabs WebSocket connected");
      setIsConnected(true);
      setIsSpeaking(true);

      // Send initial configuration
      const config = {
        text: " ", // Send initial space to start stream
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarityBoost || 0.8,
          use_speaker_boost: true,
        },
        generation_config: {
          chunk_length_schedule: [120, 160, 250, 290], // Optimized for low latency
        },
        xi_api_key: apiKey,
      };

      ws.send(JSON.stringify(config));
    };

    ws.onmessage = async (event) => {
      const response = JSON.parse(event.data);

      // Handle audio chunks
      if (response.audio) {
        // Decode base64 audio
        const audioData = Uint8Array.from(atob(response.audio), c => c.charCodeAt(0));

        // Add to queue
        audioQueueRef.current.push(audioData.buffer);

        // Start playing if not already playing
        if (!isPlayingRef.current) {
          playAudioQueue();
        }
      }

      // Handle alignment info (optional - for lip sync)
      if (response.alignment) {
        // Could be used for avatar lip sync
        console.log("Alignment:", response.alignment);
      }

      // Handle errors
      if (response.error) {
        console.error("ElevenLabs error:", response.error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("ElevenLabs WebSocket closed");
      setIsConnected(false);
      // Don't set isSpeaking to false here - wait for audio queue to finish
      // isSpeaking will be set to false in playAudioQueue when done
    };

    return ws;
  }, [initAudioContext, playAudioQueue]);

  // Flush buffered text to WebSocket
  const flushTextBuffer = useCallback(() => {
    if (textBufferRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        text: textBufferRef.current,
        try_trigger_generation: true,
      };
      wsRef.current.send(JSON.stringify(message));
      textBufferRef.current = "";
    }
  }, []);

  // Send text chunk to WebSocket (with buffering)
  const sendTextChunk = useCallback((text) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Add to buffer
    textBufferRef.current += text;

    // Clear existing timeout
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }

    // Check if we have a complete sentence or enough text
    const hasCompleteSentence = /[.!?]\s*$/.test(textBufferRef.current);
    const bufferLength = textBufferRef.current.length;

    if (hasCompleteSentence || bufferLength > 100) {
      // Send immediately if we have a complete sentence or buffer is large enough
      flushTextBuffer();
    } else {
      // Otherwise, wait a bit for more text (debounce)
      bufferTimeoutRef.current = setTimeout(() => {
        flushTextBuffer();
      }, 150); // 150ms debounce
    }
  }, [flushTextBuffer]);

  // End streaming session
  const endStreaming = useCallback(() => {
    // Clear any pending buffer timeout
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }

    // Flush any remaining buffered text
    flushTextBuffer();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send empty string to signal end of input
      const message = {
        text: "",
      };
      wsRef.current.send(JSON.stringify(message));

      // Don't close immediately - wait for all audio to be received
      // The WebSocket will close naturally when ElevenLabs finishes sending audio
    }
  }, [flushTextBuffer]);

  // Stop speaking and close connection
  const stop = useCallback(() => {
    // Clear any pending buffer timeout
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }

    // Clear text buffer
    textBufferRef.current = "";

    // Stop current audio
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      currentSourceRef.current = null;
    }

    // Clear queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsSpeaking(false);
    setIsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    startStreaming,
    sendTextChunk,
    endStreaming,
    stop,
    isSpeaking,
    isConnected,
    isSupported,
  };
}
