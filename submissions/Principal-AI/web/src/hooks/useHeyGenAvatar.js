"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";

export function useHeyGenAvatar() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const avatarRef = useRef(null);

  const API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;
  const isSupported = !!API_KEY;

  // Fetch access token from HeyGen API
  const fetchAccessToken = useCallback(async () => {
    if (!API_KEY) {
      throw new Error("HeyGen API key not configured");
    }

    try {
      const response = await fetch(
        "https://api.heygen.com/v1/streaming.create_token",
        {
          method: "POST",
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.token;
    } catch (err) {
      console.error("Error fetching access token:", err);
      throw err;
    }
  }, [API_KEY]);

  // Start avatar session
  const startSession = useCallback(async (config = {}) => {
    if (!API_KEY) {
      setError("HeyGen API key not configured");
      return null;
    }

    if (avatarRef.current) {
      console.log("Session already active");
      return stream;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get access token
      const token = await fetchAccessToken();

      // Initialize avatar
      avatarRef.current = new StreamingAvatar({ token });

      // Set up event listeners
      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log("Avatar started talking");
        setIsSpeaking(true);
      });

      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log("Avatar stopped talking");
        setIsSpeaking(false);
      });

      avatarRef.current.on(StreamingEvents.STREAM_READY, (event) => {
        console.log("Stream ready:", event.detail);
        if (event.detail) {
          setStream(event.detail);
        }
      });

      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
        endSession();
      });

      // Create session with customization
      const sessionConfig = {
        quality: AvatarQuality.High,
        avatarName: config.avatarName || "Katya_Chair_Sitting_public",
      };

      // Add voice configuration if provided
      if (config.voice) {
        sessionConfig.voice = {};
        if (config.voice.rate !== undefined) {
          sessionConfig.voice.rate = config.voice.rate;
        }
        if (config.voice.emotion !== undefined) {
          sessionConfig.voice.emotion = config.voice.emotion;
        }
      }

      console.log("Creating avatar session with config:", sessionConfig);
      const session = await avatarRef.current.createStartAvatar(sessionConfig);

      setSessionData(session);
      setIsSessionActive(true);
      console.log("Avatar session created:", session);

      return stream;
    } catch (err) {
      console.error("Error starting avatar session:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [API_KEY, fetchAccessToken, stream]);

  // Make avatar speak
  const speak = useCallback(async (text) => {
    if (!avatarRef.current) {
      console.error("Avatar session not active");
      return;
    }

    if (!text || !text.trim()) {
      console.error("No text provided");
      return;
    }

    try {
      await avatarRef.current.speak({
        text: text.trim(),
        taskType: TaskType.REPEAT,
      });
      console.log("Avatar speaking:", text);
    } catch (err) {
      console.error("Error making avatar speak:", err);
      setError(err.message);
    }
  }, []);

  // Stop avatar from speaking
  const stopSpeaking = useCallback(async () => {
    if (!avatarRef.current) {
      return;
    }

    try {
      await avatarRef.current.interrupt();
      console.log("Avatar interrupted");
      setIsSpeaking(false);
    } catch (err) {
      console.error("Error interrupting avatar:", err);
    }
  }, []);

  // End avatar session
  const endSession = useCallback(async () => {
    if (!avatarRef.current) return;

    try {
      await avatarRef.current.stopAvatar();
      avatarRef.current = null;
      setStream(null);
      setSessionData(null);
      setIsSessionActive(false);
      setIsSpeaking(false);
      console.log("Avatar session ended");
    } catch (err) {
      console.error("Error ending avatar session:", err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  return {
    // State
    isSessionActive,
    isLoading,
    stream,
    sessionData,
    error,
    isSpeaking,
    isSupported,

    // Actions
    startSession,
    endSession,
    speak,
    stopSpeaking,
  };
}
