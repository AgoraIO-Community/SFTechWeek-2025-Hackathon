"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Hook for streaming text-to-speech using ElevenLabs WebSocket API
 * Allows text to be spoken as it's being generated
 */
export function useElevenLabsStreamingTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef(null);

  // Initialize Web Audio API
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play audio chunks from queue
  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const audioContext = audioContextRef.current;

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();

      try {
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        currentSourceRef.current = source;

        // Wait for this chunk to finish playing
        await new Promise((resolve) => {
          source.onended = resolve;
          source.start(0);
        });
      } catch (error) {
        console.error("Error playing audio chunk:", error);
      }
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Stream text to ElevenLabs and play audio
  const speakStreaming = useCallback(async (textGenerator, options = {}) => {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error("ElevenLabs API key not configured");
      setIsSupported(false);
      return;
    }

    const voiceId = options.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
    const modelId = options.modelId || "eleven_monolingual_v1";

    setIsSpeaking(true);
    const audioContext = initAudioContext();
    audioQueueRef.current = [];

    try {
      // Use ElevenLabs text-to-speech endpoint with streaming
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

      // Collect all text chunks first
      let fullText = "";
      if (typeof textGenerator === 'string') {
        fullText = textGenerator;
      } else {
        // If it's an async generator
        for await (const chunk of textGenerator) {
          fullText += chunk;
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: fullText,
          model_id: modelId,
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      // Read the streaming audio response
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine chunks into single audio blob
      const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
      const arrayBuffer = await audioBlob.arrayBuffer();

      audioQueueRef.current.push(arrayBuffer);
      playAudioQueue();

    } catch (error) {
      console.error("Error with ElevenLabs streaming:", error);
      setIsSpeaking(false);
    }
  }, [initAudioContext, playAudioQueue]);

  // Stop speaking
  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      currentSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return {
    speakStreaming,
    stop,
    isSpeaking,
    isSupported,
  };
}
