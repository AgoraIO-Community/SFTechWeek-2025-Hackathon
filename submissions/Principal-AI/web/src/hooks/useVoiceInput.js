"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook for managing voice input using Web Speech API with Echo Cancellation
 * Returns transcript and control functions
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef(null);
  const audioStreamRef = useRef(null);

  useEffect(() => {
    // Initialize microphone with AEC and Web Speech API
    const initializeMicrophone = async () => {
      if (typeof window === "undefined") return;

      try {
        // Request microphone with Echo Cancellation enabled
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,      // Enable AEC
            noiseSuppression: true,      // Remove background noise
            autoGainControl: true,       // Normalize volume
          }
        });

        audioStreamRef.current = stream;
        console.log("✅ Microphone initialized with AEC enabled");

        // Initialize Web Speech API
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
          setIsSupported(true);
          const recognition = new SpeechRecognition();
          recognition.continuous = false; // Stop after one utterance
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            // Only process if not muted
            if (isMuted) return;

            let interimText = "";
            let finalText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalText += transcript;
              } else {
                interimText += transcript;
              }
            }

            if (finalText) {
              setTranscript(finalText);
              setInterimTranscript("");
            } else {
              setInterimTranscript(interimText);
            }
          };

          recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setError(`Speech error: ${event.error}`);
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } else {
          setError("Speech recognition not supported in this browser");
        }
      } catch (err) {
        console.error("Error initializing microphone:", err);
        setError(`Microphone access denied: ${err.message}`);
      }
    };

    initializeMicrophone();

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore if already stopped
        }
      }

      // Stop microphone stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition not initialized");
      return;
    }

    try {
      setTranscript("");
      setInterimTranscript("");
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error starting recognition:", err);
      setError(`Failed to start: ${err.message}`);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      console.error("Error stopping recognition:", err);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  // Mute microphone (prevent echo during TTS)
  const muteMicrophone = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      setIsMuted(true);
      console.log("🔇 Microphone muted (preventing echo)");
    }
  }, []);

  // Unmute microphone
  const unmuteMicrophone = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
      setIsMuted(false);
      console.log("🎤 Microphone unmuted");
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    isMuted,
    startListening,
    stopListening,
    resetTranscript,
    muteMicrophone,
    unmuteMicrophone,
  };
}
