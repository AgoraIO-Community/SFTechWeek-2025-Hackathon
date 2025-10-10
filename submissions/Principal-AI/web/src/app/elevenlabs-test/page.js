"use client";

import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useState, useRef } from "react";

export default function ElevenLabsTestPage() {
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  // ElevenLabs config
  const API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice (default)

  const generateSpeech = async () => {
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    if (!API_KEY) {
      setError("ElevenLabs API key not configured");
      return;
    }

    setLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Auto-play the audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err) {
      console.error("Error generating speech:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "speech.mp3";
      a.click();
    }
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Link
            href="/"
            style={{
              color: theme.colors.primary,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Logo width={100} height={100} theme={theme} />
          </Link>

          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              margin: "0",
              color: theme.colors.primary,
              lineHeight: "1",
            }}
          >
            ElevenLabs Text-to-Speech Test
          </h1>
        </div>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          Convert text to natural-sounding speech using ElevenLabs AI
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
            {API_KEY ? "✅" : "❌"} ElevenLabs API key configured
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ✅ Text-to-Speech API integration ready
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ✅ Audio playback controls ready
          </div>
        </div>

        {/* Input Card */}
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
            Enter Text
          </h2>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text here to convert to speech..."
            style={{
              width: "100%",
              minHeight: "150px",
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

          <button
            onClick={generateSpeech}
            disabled={loading || !text.trim()}
            style={{
              backgroundColor: loading ? "#6b7280" : theme.colors.primary,
              color: theme.colors.background,
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              border: "none",
              cursor: loading || !text.trim() ? "not-allowed" : "pointer",
              fontWeight: "500",
              fontSize: "1rem",
              opacity: loading || !text.trim() ? 0.6 : 1,
            }}
          >
            {loading ? "🔊 Generating..." : "🔊 Generate Speech"}
          </button>
        </div>

        {/* Audio Player Card */}
        {audioUrl && (
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
              Generated Audio
            </h2>

            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              style={{
                width: "100%",
                marginBottom: "1rem",
              }}
            />

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={playAudio}
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
                ▶ Play
              </button>
              <button
                onClick={downloadAudio}
                style={{
                  backgroundColor: "transparent",
                  color: theme.colors.text,
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  border: `1px solid ${theme.colors.border}`,
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "1rem",
                }}
              >
                ⬇ Download MP3
              </button>
            </div>
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
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#60a5fa" }}
              >
                elevenlabs.io
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
                NEXT_PUBLIC_ELEVENLABS_API_KEY
              </code>{" "}
              in .env.local
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              Type or paste text in the box above
            </li>
            <li>Click &quot;Generate Speech&quot; to hear the AI voice</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
