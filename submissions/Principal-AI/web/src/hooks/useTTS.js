"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook for text-to-speech using Web Speech API
 * Falls back to browser TTS if ElevenLabs is not configured
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback(
    (text, options = {}) => {
      if (!synthRef.current || !text) return;

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice settings
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Get voices and try to find a good default
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        // Try to find an English voice
        const englishVoice = voices.find(
          (voice) => voice.lang.startsWith("en-")
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    []
  );

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.resume();
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
  };
}
