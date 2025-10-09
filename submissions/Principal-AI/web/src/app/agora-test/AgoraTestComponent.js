"use client";

import { useTheme } from "@a24z/industry-theme";
import { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

export default function AgoraTestComponent() {
  const { theme } = useTheme();
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);

  const clientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const recognitionRef = useRef(null);

  // Agora config - using env variable or fallback
  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "test-app-id";
  const CHANNEL = "principal-ai-test";
  const TOKEN = null; // For testing without token

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;

          if (event.results[current].isFinal) {
            setTranscript((prev) => [...prev, transcriptText]);
          }
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setError(`Speech error: ${event.error}`);
          setListening(false);
        };

        recognition.onend = () => {
          setListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setError("Speech recognition not supported in this browser");
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore if already stopped
        }
      }
    };
  }, []);

  const connectToAgora = async () => {
    try {
      setStatus("Connecting...");
      setError(null);

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Join channel
      const uid = await client.join(APP_ID, CHANNEL, TOKEN, null);
      setStatus(`Connected (UID: ${uid})`);

      // Create and publish microphone track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "speech_standard",
      });
      audioTrackRef.current = audioTrack;

      await client.publish([audioTrack]);
      setConnected(true);
      setStatus(`Connected & Publishing (UID: ${uid})`);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setListening(true);
        setStatus(`🎤 Listening... (UID: ${uid})`);
      }
    } catch (err) {
      console.error("Error connecting to Agora:", err);
      setError(`Connection error: ${err.message}`);
      setStatus("Connection failed");
    }
  };

  const disconnect = async () => {
    try {
      setStatus("Disconnecting...");

      // Stop speech recognition
      if (recognitionRef.current && listening) {
        recognitionRef.current.stop();
        setListening(false);
      }

      // Close audio track
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      setConnected(false);
      setStatus("Disconnected");
    } catch (err) {
      console.error("Error disconnecting:", err);
      setError(`Disconnect error: ${err.message}`);
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
  };

  return (
    <>
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
          Connection Status
        </h2>

        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: connected ? "#10b981" : "#ef4444",
            }}
          />
          <span style={{ fontSize: "1rem" }}>{status}</span>
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

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>✅ Agora SDK installed</div>
          <div style={{ marginBottom: "0.5rem" }}>
            {recognitionRef.current ? "✅" : "❌"} Speech-to-Text available
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            {connected ? "✅" : "⏳"} Audio streaming{" "}
            {connected ? "active" : "pending"}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          {!connected ? (
            <button
              onClick={connectToAgora}
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.background,
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "1rem",
              }}
            >
              🎤 Connect & Start Listening
            </button>
          ) : (
            <button
              onClick={disconnect}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "1rem",
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Transcript Card */}
      <div
        style={{
          backgroundColor: theme.colors.backgroundSecondary,
          padding: "2rem",
          borderRadius: "8px",
          border: `1px solid ${theme.colors.border}`,
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            Speech Transcript
          </h2>
          <button
            onClick={clearTranscript}
            style={{
              backgroundColor: "transparent",
              color: theme.colors.textSecondary,
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: `1px solid ${theme.colors.border}`,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Clear
          </button>
        </div>

        <div
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: "6px",
            padding: "1rem",
            minHeight: "300px",
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          {transcript.length === 0 ? (
            <p
              style={{
                color: theme.colors.textSecondary,
                fontStyle: "italic",
              }}
            >
              {connected
                ? "🎤 Start speaking to see transcript..."
                : "Connect and start listening to see transcript"}
            </p>
          ) : (
            <div>
              {transcript.map((line, index) => (
                <p
                  key={index}
                  style={{
                    marginBottom: "0.75rem",
                    color: theme.colors.text,
                  }}
                >
                  <span
                    style={{
                      color: theme.colors.textSecondary,
                      marginRight: "0.5rem",
                    }}
                  >
                    [{index + 1}]
                  </span>
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

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
            Set{" "}
            <code
              style={{
                backgroundColor: theme.colors.background,
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              NEXT_PUBLIC_AGORA_APP_ID
            </code>{" "}
            in .env.local (or test without it)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Click &quot;Connect &amp; Start Listening&quot;
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Allow microphone access when prompted
          </li>
          <li>
            Start speaking - your speech will appear in the transcript below
          </li>
        </ol>
      </div>
    </>
  );
}
