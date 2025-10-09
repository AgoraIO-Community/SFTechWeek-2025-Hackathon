"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";

interface ExampleRepo {
  name: string;
  url: string;
  description: string;
}

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

  // Conversation state
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAvatarReady, setIsAvatarReady] = useState<boolean>(false);

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

  const handleLoadRepo = async (): Promise<void> => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Call API to load repository
      // For now, simulate loading
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsRepoLoaded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load repository";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleRepos: ExampleRepo[] = [
    {
      name: "Example Repo 1",
      url: "https://github.com/example/repo1",
      description: "Sample repository with MemoryPalace structure",
    },
    {
      name: "Example Repo 2",
      url: "https://github.com/example/repo2",
      description: "Another example with .alexandria/ docs",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
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
          /* Repository Input Section */
          <div>
            {/* Main Card */}
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
                Load Your Codebase
              </h2>
              <p style={{ marginBottom: "1rem", color: theme.colors.textSecondary }}>
                Enter a GitHub repository URL to start a conversation with your AI Principal Engineer.
              </p>
              <p style={{ marginBottom: "1.5rem", color: theme.colors.textSecondary, fontSize: "0.95rem" }}>
                The repository should contain a <code style={{
                  backgroundColor: theme.colors.background,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  fontFamily: theme.fonts.monospace
                }}>.alexandria/</code> directory with MemoryPalace documentation.
              </p>

              <label
                htmlFor="repo-url"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: theme.colors.text,
                }}
              >
                GitHub Repository URL
              </label>
              <input
                id="repo-url"
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: theme.fonts.body,
                  marginBottom: "1rem",
                }}
                disabled={isLoading}
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
                onClick={handleLoadRepo}
                disabled={isLoading || !repoUrl.trim()}
                style={{
                  backgroundColor:
                    isLoading || !repoUrl.trim()
                      ? "#6b7280"
                      : theme.colors.primary,
                  color: theme.colors.background,
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  border: "none",
                  cursor:
                    isLoading || !repoUrl.trim() ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  fontSize: "1rem",
                  opacity: isLoading || !repoUrl.trim() ? 0.6 : 1,
                }}
              >
                {isLoading ? "🔄 Loading Repository..." : "▶ Load Repository"}
              </button>
            </div>

            {/* Example Repositories */}
            <div
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                padding: "2rem",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                }}
              >
                Example Repositories
              </h2>
              <p style={{ marginBottom: "1.5rem", color: theme.colors.textSecondary, fontSize: "0.95rem" }}>
                Click an example to load it automatically
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {exampleRepos.map((example) => (
                  <button
                    key={example.url}
                    onClick={() => setRepoUrl(example.url)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "1rem",
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.border;
                    }}
                  >
                    <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{example.name}</div>
                    <div style={{ fontSize: "0.9rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
                      {example.description}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fonts.monospace,
                      }}
                    >
                      {example.url}
                    </div>
                  </button>
                ))}
              </div>
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
              }}
            >
              <div>
                <span style={{ color: theme.colors.textSecondary, fontSize: "0.9rem" }}>Repository: </span>
                <span style={{ fontFamily: theme.fonts.monospace, fontSize: "0.9rem" }}>{repoUrl}</span>
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
                        // TODO: Start Agora voice capture
                      } else if (voiceStatus === "listening") {
                        setVoiceStatus("processing");
                        // TODO: Stop capture and process
                      }
                    }}
                    disabled={voiceStatus === "processing" || voiceStatus === "speaking"}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor:
                        voiceStatus === "listening"
                          ? "#ef4444"
                          : voiceStatus === "processing" || voiceStatus === "speaking"
                          ? "#6b7280"
                          : theme.colors.primary,
                      color: theme.colors.background,
                      cursor:
                        voiceStatus === "processing" || voiceStatus === "speaking" ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      fontSize: "1rem",
                      opacity: voiceStatus === "processing" || voiceStatus === "speaking" ? 0.6 : 1,
                    }}
                  >
                    {voiceStatus === "idle" && "🎤 Hold to Talk"}
                    {voiceStatus === "listening" && "⏹️ Stop Recording"}
                    {voiceStatus === "processing" && "⚙️ Processing..."}
                    {voiceStatus === "speaking" && "🔊 Speaking..."}
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
