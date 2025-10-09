"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTTS } from "@/hooks/useTTS";
import { LoadingAnimation } from "@/components/LoadingAnimation";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type VoiceStatus = "idle" | "listening" | "processing" | "speaking";

export default function DemoPage() {
  const { theme } = useTheme();
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRepoLoaded, setIsRepoLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => `session-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  // Conversation state
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [textInput, setTextInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Avatar & TTS toggles
  const [enableTTS, setEnableTTS] = useState<boolean>(false);
  const [enableAvatar, setEnableAvatar] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAvatarReady, setIsAvatarReady] = useState<boolean>(false);

  // Voice input hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  // TTS hook
  const { speak, stop: stopSpeaking, isSpeaking } = useTTS();

  // Set body background and html background color to match theme
  useEffect(() => {
    const originalBodyBg = document.body.style.backgroundColor;
    const originalHtmlBg = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = theme.colors.background;
    document.documentElement.style.backgroundColor = theme.colors.background;

    return () => {
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
    };
  }, [theme.colors.background]);

  // Handle voice transcript completion
  useEffect(() => {
    if (transcript && !isListening && voiceStatus === "listening") {
      // Voice input complete, send the message
      setVoiceStatus("processing");
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, voiceStatus]);

  // Handle TTS completion
  useEffect(() => {
    if (!isSpeaking && voiceStatus === "speaking") {
      setVoiceStatus("idle");
    }
  }, [isSpeaking, voiceStatus]);

  const handleLoadRepo = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setRepoUrl(SUPPORTED_REPO);

    try {
      const response = await fetch("/api/load-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load repository");
      }

      console.log("Repository loaded:", data);
      setIsRepoLoaded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load repository";
      setError(errorMessage);
      console.error("Error loading repository:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Currently supported repository
  const SUPPORTED_REPO = "https://github.com/a24z-ai/core-library";

  const handleSendMessage = async (message: string): Promise<void> => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setVoiceStatus("processing");

    // Add user message to history
    const userMessage: ConversationMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setConversationHistory((prev) => [...prev, userMessage]);
    setTextInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant response to history
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [...prev, assistantMessage]);

      // Speak the response if TTS is enabled
      if (enableTTS) {
        setVoiceStatus("speaking");
        speak(data.response);
        // Note: We'll set back to idle when TTS finishes (handled by isSpeaking effect)
      } else {
        setVoiceStatus("idle");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      console.error("Error sending message:", err);
      // Add error message to chat
      const errorMsg: ConversationMessage = {
        role: "assistant",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [...prev, errorMsg]);
      setVoiceStatus("idle");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem", minHeight: "100vh" }}>
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
            fontWeight: "300",
            marginBottom: "1rem",
            color: theme.colors.text,
          }}
        >
          Principal AI Demo
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          Have a voice conversation with your AI Principal Engineer
        </p>

        {!isRepoLoaded ? (
          /* Repository Loading Section */
          <div>
            {/* Main Card */}
            <div
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                padding: "2rem",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.border}`,
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                }}
              >
                Load Demo Repository
              </h2>
              <p style={{ marginBottom: "1rem", color: theme.colors.textSecondary }}>
                This demo uses the <strong>a24z-ai/core-library</strong> repository with Alexandria documentation.
              </p>
              <p style={{ marginBottom: "1.5rem", color: theme.colors.textSecondary, fontSize: "0.95rem" }}>
                The repository contains a <code style={{
                  backgroundColor: theme.colors.background,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  fontFamily: theme.fonts.monospace
                }}>.alexandria/</code> directory with structured codebase views, notes, and guidance.
              </p>

              <div
                style={{
                  backgroundColor: theme.colors.background,
                  padding: "1rem",
                  borderRadius: "6px",
                  border: `1px solid ${theme.colors.border}`,
                  marginBottom: "1.5rem",
                  fontFamily: theme.fonts.monospace,
                  fontSize: "0.95rem",
                }}
              >
                {SUPPORTED_REPO}
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

              {isLoading ? (
                <LoadingAnimation message="Loading repository and parsing codebase views" />
              ) : (
                <button
                  onClick={handleLoadRepo}
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.background,
                    padding: "0.75rem 2rem",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "1rem",
                  }}
                >
                  Load Repository
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Main Demo Interface - Conversation with Avatar */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Repository Info Bar */}
            <div
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                padding: "1rem 1.5rem",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ flex: "1 1 auto" }}>
                <span style={{ color: theme.colors.textSecondary, fontSize: "0.9rem" }}>Repository: </span>
                <span style={{ fontFamily: theme.fonts.monospace, fontSize: "0.9rem" }}>{repoUrl}</span>
              </div>

              {/* Feature Toggles */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={enableTTS}
                    onChange={(e) => setEnableTTS(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>Enable TTS</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={enableAvatar}
                    onChange={(e) => setEnableAvatar(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>Enable Avatar</span>
                </label>
              </div>

              <button
                onClick={() => setIsRepoLoaded(false)}
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: `1px solid ${theme.colors.border}`,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Change Repository
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Avatar Panel */}
              <div
                style={{
                  backgroundColor: theme.colors.backgroundSecondary,
                  padding: "1.5rem",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "0",
                  }}
                >
                  Principal Engineer AI
                </h2>

                {/* Avatar Display Area */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    backgroundColor: theme.colors.background,
                    borderRadius: "8px",
                    border: `1px solid ${theme.colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {!isAvatarReady ? (
                    <div style={{ textAlign: "center", color: theme.colors.textSecondary }}>
                      <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>👤</div>
                      <div>Avatar initializing...</div>
                    </div>
                  ) : (
                    <div
                      id="avatar-container"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      {/* HeyGen avatar will be rendered here */}
                    </div>
                  )}
                </div>

                {/* Voice Controls */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  {/* Status Indicator */}
                  <div
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      backgroundColor: theme.colors.background,
                      textAlign: "center",
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <span style={{ fontSize: "0.9rem", color: theme.colors.textSecondary }}>Status: </span>
                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color:
                          voiceStatus === "listening"
                            ? "#3b82f6"
                            : voiceStatus === "speaking"
                            ? "#10b981"
                            : voiceStatus === "processing"
                            ? "#f59e0b"
                            : theme.colors.text,
                      }}
                    >
                      {voiceStatus === "idle" && "Ready to listen"}
                      {voiceStatus === "listening" && "🎤 Listening..."}
                      {voiceStatus === "processing" && "⚙️ Processing..."}
                      {voiceStatus === "speaking" && "🔊 Speaking..."}
                    </span>
                  </div>

                  {/* Talk Button */}
                  <button
                    onClick={() => {
                      if (voiceStatus === "idle") {
                        setVoiceStatus("listening");
                        startListening();
                      } else if (voiceStatus === "listening") {
                        stopListening();
                        // The useEffect will handle sending the message when transcript is ready
                      }
                    }}
                    disabled={voiceStatus === "processing" || voiceStatus === "speaking" || !isVoiceSupported}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor:
                        !isVoiceSupported
                          ? "#6b7280"
                          : voiceStatus === "listening"
                          ? "#ef4444"
                          : voiceStatus === "processing" || voiceStatus === "speaking"
                          ? "#6b7280"
                          : theme.colors.primary,
                      color: theme.colors.background,
                      cursor:
                        voiceStatus === "processing" || voiceStatus === "speaking" || !isVoiceSupported
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "600",
                      fontSize: "1rem",
                      opacity: voiceStatus === "processing" || voiceStatus === "speaking" || !isVoiceSupported ? 0.6 : 1,
                    }}
                  >
                    {!isVoiceSupported && "Voice Not Supported"}
                    {isVoiceSupported && voiceStatus === "idle" && "Start Talking"}
                    {isVoiceSupported && voiceStatus === "listening" && (interimTranscript ? `"${interimTranscript}..."` : "Listening...")}
                    {voiceStatus === "processing" && "Processing..."}
                    {voiceStatus === "speaking" && "Speaking..."}
                  </button>
                </div>
              </div>

              {/* Conversation History Panel */}
              <div
                style={{
                  backgroundColor: theme.colors.backgroundSecondary,
                  padding: "1.5rem",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "0",
                  }}
                >
                  Conversation History
                </h2>

                {/* Messages Container */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    maxHeight: "500px",
                    padding: "0.5rem",
                  }}
                >
                  {conversationHistory.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        color: theme.colors.textSecondary,
                        padding: "2rem",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
                      <p>No messages yet. Click &quot;Hold to Talk&quot; to start a conversation!</p>
                      <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
                        Try asking:
                        <br />
                        &quot;What&apos;s the architecture of this project?&quot;
                        <br />
                        &quot;How is the authentication system implemented?&quot;
                      </p>
                    </div>
                  ) : (
                    conversationHistory.map((message, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "1rem",
                          borderRadius: "6px",
                          backgroundColor:
                            message.role === "user" ? theme.colors.background : theme.colors.backgroundSecondary,
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: theme.colors.textSecondary,
                            marginBottom: "0.5rem",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontWeight: "600" }}>
                            {message.role === "user" ? "👤 You" : "🤖 Principal Engineer"}
                          </span>
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>{message.content}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Text Input Area */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isSending) {
                        e.preventDefault();
                        handleSendMessage(textInput);
                      }
                    }}
                    placeholder="Type a message (or use voice)..."
                    disabled={isSending}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1rem",
                      borderRadius: "6px",
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      fontSize: "0.95rem",
                      fontFamily: theme.fonts.body,
                    }}
                  />
                  <button
                    onClick={() => handleSendMessage(textInput)}
                    disabled={isSending || !textInput.trim()}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: isSending || !textInput.trim() ? "#6b7280" : theme.colors.primary,
                      color: theme.colors.background,
                      cursor: isSending || !textInput.trim() ? "not-allowed" : "pointer",
                      fontWeight: "500",
                      fontSize: "0.95rem",
                      opacity: isSending || !textInput.trim() ? 0.6 : 1,
                    }}
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </div>

                {/* Clear History Button */}
                {conversationHistory.length > 0 && (
                  <button
                    onClick={() => setConversationHistory([])}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Clear History
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
