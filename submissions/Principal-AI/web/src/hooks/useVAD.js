"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Voice Activity Detection (VAD) hook
 * Detects when user starts speaking to enable natural conversation interrupts
 * Based on Agora's recommended VAD parameters
 */
export function useVAD(options = {}) {
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  // VAD configuration (based on Agora recommendations)
  const config = {
    threshold: options.threshold || 0.2, // Increased threshold to ignore echo
    interruptDuration: options.interruptDuration || 300, // Longer confirmation to avoid false positives
    silenceDuration: options.silenceDuration || 600, // ms of silence to end turn
    smoothingTimeConstant: options.smoothingTimeConstant || 0.8,
    fftSize: options.fftSize || 2048,
    minVoiceFrequency: 85, // Human voice starts around 85Hz
    maxVoiceFrequency: 255, // Focus on human speech range (85-255Hz)
  };

  const voiceStartTimeRef = useRef(0);
  const voiceConfirmedRef = useRef(false);

  // Initialize audio context and analyser
  const startMonitoring = useCallback(async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = config.fftSize;
      analyser.smoothingTimeConstant = config.smoothingTimeConstant;
      analyserRef.current = analyser;

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsMonitoring(true);

      // Start monitoring loop
      monitorAudioLevel();
    } catch (error) {
      console.error("Error starting VAD:", error);
    }
  }, [config.fftSize, config.smoothingTimeConstant]);

  // Monitor audio levels and detect voice activity
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);

      // Focus on human voice frequency range (85-255Hz)
      // This helps distinguish user voice from speaker echo
      const nyquist = analyserRef.current.context.sampleRate / 2;
      const binWidth = nyquist / bufferLength;
      const minBin = Math.floor(config.minVoiceFrequency / binWidth);
      const maxBin = Math.floor(config.maxVoiceFrequency / binWidth);

      // Calculate average volume in voice frequency range
      let sum = 0;
      let count = 0;
      for (let i = minBin; i <= maxBin && i < bufferLength; i++) {
        sum += dataArray[i];
        count++;
      }
      const average = count > 0 ? sum / count : 0;
      const normalizedVolume = average / 255; // Normalize to 0-1

      const now = Date.now();

      // Voice detected above threshold
      if (normalizedVolume > config.threshold) {
        if (!voiceConfirmedRef.current) {
          if (voiceStartTimeRef.current === 0) {
            // First detection
            voiceStartTimeRef.current = now;
          } else if (now - voiceStartTimeRef.current >= config.interruptDuration) {
            // Voice confirmed after interrupt duration
            voiceConfirmedRef.current = true;
            setIsVoiceDetected(true);
          }
        }

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else {
        // Below threshold - potential silence
        if (voiceConfirmedRef.current && !silenceTimeoutRef.current) {
          // Start silence countdown
          silenceTimeoutRef.current = setTimeout(() => {
            voiceConfirmedRef.current = false;
            voiceStartTimeRef.current = 0;
            setIsVoiceDetected(false);
            silenceTimeoutRef.current = null;
          }, config.silenceDuration);
        } else if (!voiceConfirmedRef.current) {
          // Reset if voice not confirmed
          voiceStartTimeRef.current = 0;
        }
      }

      // Continue monitoring
      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }, [config.threshold, config.interruptDuration, config.silenceDuration]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Stop microphone stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset state
    voiceConfirmedRef.current = false;
    voiceStartTimeRef.current = 0;
    setIsVoiceDetected(false);
    setIsMonitoring(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    isVoiceDetected,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
}
