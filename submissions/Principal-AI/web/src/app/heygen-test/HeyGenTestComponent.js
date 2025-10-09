"use client";

import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";

export default function HeyGenTestComponent() {
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  const avatarRef = useRef(null);
  const videoRef = useRef(null);

  // HeyGen config
  const API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  // Handle video stream
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    }
  }, [stream]);

  async function fetchAccessToken() {
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
  }

  async function startSession() {
    if (!API_KEY) {
      setError("HeyGen API key not configured");
      return;
    }

    setIsLoadingSession(true);
    setError(null);

    try {
      // Get access token
      const token = await fetchAccessToken();

      // Initialize avatar
      avatarRef.current = new StreamingAvatar({ token });

      // Set up event listeners
      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log("Avatar started talking");
      });

      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log("Avatar stopped talking");
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

      // Create session
      const session = await avatarRef.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "default", // Using default avatar
      });

      setSessionData(session);
      console.log("Session created:", session);
    } catch (err) {
      console.error("Error starting session:", err);
      setError(err.message);
    } finally {
      setIsLoadingSession(false);
    }
  }

  async function handleSpeak() {
    if (!avatarRef.current || !text.trim()) {
      setError("Please enter text and ensure session is active");
      return;
    }

    setIsLoadingRepeat(true);
    setError(null);

    try {
      await avatarRef.current.speak({
        text: text,
        taskType: TaskType.REPEAT,
      });
      console.log("Avatar speaking:", text);
    } catch (err) {
      console.error("Error making avatar speak:", err);
      setError(err.message);
    } finally {
      setIsLoadingRepeat(false);
    }
  }

  async function endSession() {
    if (!avatarRef.current) return;

    try {
      await avatarRef.current.stopAvatar();
      avatarRef.current = null;
      setStream(null);
      setSessionData(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.log("Session ended");
    } catch (err) {
      console.error("Error ending session:", err);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        padding: "2rem",
        fontFamily: theme.fonts.body,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: theme.colors.primary,
            textDecoration: "none",
            marginBottom: "2rem",
            display: "inline-block",
          }}
        >
          ← Back to Home
        </Link>

        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            marginBottom: "1rem",
            color: theme.colors.primary,
          }}
        >
          HeyGen Interactive Avatar Test
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          Test real-time AI avatar with video streaming and text-to-speech
        </p>

        {/* Status Card */}
        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            padding: "2rem",
            borderRadius: "8px",
            border: `1px solid ${theme.colors.border}`,
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Integration Status
          </h2>
          <div style={{ marginBottom: "0.5rem" }}>
            {API_KEY ? "✅" : "❌"} HeyGen API key configured
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            {sessionData ? "✅" : "⏳"} Avatar session{" "}
            {sessionData ? "active" : "inactive"}
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            {stream ? "✅" : "⏳"} Video stream{" "}
            {stream ? "connected" : "disconnected"}
          </div>
        </div>

        {/* Video Display */}
        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            padding: "2rem",
            borderRadius: "8px",
            border: `1px solid ${theme.colors.border}`,
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Avatar Preview
          </h2>
          <div
            style={{
              width: "100%",
              height: "400px",
              backgroundColor: theme.colors.background,
              border: `2px solid ${theme.colors.border}`,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              overflow: "hidden",
            }}
          >
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <p style={{ color: theme.colors.textSecondary }}>
                {sessionData
                  ? "Waiting for video stream..."
                  : "Click 'Start Session' to load avatar"}
              </p>
            )}
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                borderRadius: "6px",
                padding: "0.75rem",
                marginBottom: "1rem",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {!sessionData ? (
              <button
                onClick={startSession}
                disabled={isLoadingSession || !API_KEY}
                style={{
                  backgroundColor:
                    isLoadingSession || !API_KEY
                      ? "#6b7280"
                      : theme.colors.primary,
                  color: theme.colors.background,
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  border: "none",
                  cursor:
                    isLoadingSession || !API_KEY ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  fontSize: "1rem",
                  opacity: isLoadingSession || !API_KEY ? 0.6 : 1,
                }}
              >
                {isLoadingSession ? "🔄 Starting..." : "▶ Start Session"}
              </button>
            ) : (
              <button
                onClick={endSession}
                style={{
                  backgroundColor: "#ef4444",
                  color: theme.colors.background,
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "1rem",
                }}
              >
                ⏹ End Session
              </button>
            )}
          </div>
        </div>

        {/* Text Input */}
        {sessionData && (
          <div
            style={{
              backgroundColor: theme.colors.backgroundSecondary,
              padding: "2rem",
              borderRadius: "8px",
              border: `1px solid ${theme.colors.border}`,
              marginBottom: "2rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "1rem",
              }}
            >
              Make Avatar Speak
            </h2>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type what you want the avatar to say..."
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "1rem",
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "6px",
                fontSize: "1rem",
                fontFamily: theme.fonts.body,
                resize: "vertical",
                marginBottom: "1rem",
              }}
            />

            <button
              onClick={handleSpeak}
              disabled={isLoadingRepeat || !text.trim()}
              style={{
                backgroundColor:
                  isLoadingRepeat || !text.trim()
                    ? "#6b7280"
                    : theme.colors.primary,
                color: theme.colors.background,
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                border: "none",
                cursor:
                  isLoadingRepeat || !text.trim() ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "1rem",
                opacity: isLoadingRepeat || !text.trim() ? 0.6 : 1,
              }}
            >
              {isLoadingRepeat ? "🔊 Speaking..." : "🔊 Speak"}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.5)",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#60a5fa",
            }}
          >
            📝 Instructions:
          </h3>
          <ol
            style={{
              fontSize: "0.95rem",
              color: theme.colors.textSecondary,
              lineHeight: "1.6",
              paddingLeft: "1.5rem",
            }}
          >
            <li style={{ marginBottom: "0.5rem" }}>
              Get your API key from{" "}
              <a
                href="https://app.heygen.com/settings"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#60a5fa" }}
              >
                app.heygen.com/settings
              </a>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              Set{" "}
              <code
                style={{
                  backgroundColor: theme.colors.background,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                NEXT_PUBLIC_HEYGEN_API_KEY
              </code>{" "}
              in .env.local
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              Click &quot;Start Session&quot; to load the avatar
            </li>
            <li>
              Type text and click &quot;Speak&quot; to make the avatar talk
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
