"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTTS } from "@/hooks/useTTS";
import { useElevenLabsWebSocketTTS } from "@/hooks/useElevenLabsWebSocketTTS";
import { useVAD } from "@/hooks/useVAD";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { AvatarSettingsModal } from "@/components/AvatarSettingsModal";
import { ExcalidrawViewer, type ExcalidrawScene } from "@/components/ExcalidrawViewer";
import { FileReferences } from "@/components/FileReferences";
import { Settings, User, Clock, Radio, X, Mic, Cog, Volume2, Mic2, Square, Hand, MessageCircle, Folder, Bot, BarChart3 } from "lucide-react";

interface FileReference {
  path: string;
  lineNumber?: number;
  relevance: 'primary' | 'secondary' | 'mentioned';
  context?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  diagram?: ExcalidrawScene;
  fileReferences?: FileReference[];
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
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);

  // Avatar toggle and state
  const [enableAvatar, setEnableAvatar] = useState<boolean>(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [voiceEmotion, setVoiceEmotion] = useState<string>("SOOTHING");
  const [voiceRate, setVoiceRate] = useState<number>(1.3);
  const [showAvatarSettings, setShowAvatarSettings] = useState<boolean>(false);

  // API metadata (v0.3.1 view-aware responses)
  const [apiMetadata, setApiMetadata] = useState<any>(null);

  // Diagram state
  const [currentDiagram, setCurrentDiagram] = useState<ExcalidrawScene | null>(null);

  // Tab state for conversation view
  const [activeTab, setActiveTab] = useState<'conversation' | 'files'>('conversation');

  // Voice input hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    isSupported: isVoiceSupported,
    isMuted,
    startListening,
    stopListening,
    resetTranscript,
    muteMicrophone,
    unmuteMicrophone,
  } = useVoiceInput();

  // TTS hooks - fallback to browser TTS if ElevenLabs not configured
  const { speak, stop: stopSpeaking, isSpeaking } = useTTS();
  const {
    startStreaming,
    sendTextChunk,
    endStreaming,
    stop: stopElevenLabs,
    isSpeaking: isSpeakingElevenLabs,
    isConnected: isElevenLabsConnected,
    isSupported: isElevenLabsSupported
  } = useElevenLabsWebSocketTTS();

  // HeyGen Avatar hook
  const {
    isSessionActive: isAvatarSessionActive,
    isLoading: isAvatarLoading,
    stream: avatarStream,
    isSpeaking: isAvatarSpeaking,
    isSupported: isAvatarSupported,
    startSession: startAvatarSession,
    endSession: endAvatarSession,
    speak: avatarSpeak,
    stopSpeaking: stopAvatarSpeaking,
  } = useHeyGenAvatar();

  // Removed VAD for now - using manual interrupt button instead

  // Use HeyGen avatar if enabled, otherwise use ElevenLabs or browser TTS
  const useAvatar = enableAvatar && isAvatarSupported && isAvatarSessionActive;
  const useElevenLabs = !useAvatar && isElevenLabsSupported && process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const actualIsSpeaking = useAvatar ? isAvatarSpeaking : (useElevenLabs ? isSpeakingElevenLabs : isSpeaking);
  const stopActualSpeaking = useAvatar ? stopAvatarSpeaking : (useElevenLabs ? stopElevenLabs : stopSpeaking);

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

  // Handle avatar enable/disable and voice settings changes
  useEffect(() => {
    if (enableAvatar && !isAvatarSessionActive && !isAvatarLoading) {
      console.log("🎭 Starting avatar session with voice config:", { emotion: voiceEmotion, rate: voiceRate });
      startAvatarSession({
        voice: {
          emotion: voiceEmotion,
          rate: voiceRate,
        },
      });
    } else if (!enableAvatar && isAvatarSessionActive) {
      console.log("🎭 Ending avatar session...");
      endAvatarSession();
    }
  }, [enableAvatar, isAvatarSessionActive, isAvatarLoading, startAvatarSession, endAvatarSession, voiceEmotion, voiceRate]);

  // Restart avatar session when voice settings change
  useEffect(() => {
    if (enableAvatar && isAvatarSessionActive && !isAvatarLoading) {
      console.log("🎭 Restarting avatar session with new voice config:", { emotion: voiceEmotion, rate: voiceRate });
      const restart = async () => {
        await endAvatarSession();
        setTimeout(() => {
          startAvatarSession({
            voice: {
              emotion: voiceEmotion,
              rate: voiceRate,
            },
          });
        }, 500);
      };
      restart();
    }
  }, [voiceEmotion, voiceRate]);

  // Handle avatar video stream
  useEffect(() => {
    if (avatarStream && videoRef) {
      videoRef.srcObject = avatarStream;
      videoRef.onloadedmetadata = () => {
        videoRef.play();
      };
    }
  }, [avatarStream, videoRef]);

  // Handle voice transcript completion - auto-send when demo is active
  useEffect(() => {
    if (transcript && !isListening && isDemoActive) {
      // Voice input complete, send the message
      setVoiceStatus("processing");
      handleSendMessage(transcript);
      resetTranscript();

      // Restart listening after a short delay (after message is sent)
      setTimeout(() => {
        if (isDemoActive && !isSending) {
          startListening();
          setVoiceStatus("listening");
        }
      }, 500);
    }
  }, [transcript, isListening, isDemoActive, isSending]);

  // Mute microphone when TTS starts (prevent echo)
  useEffect(() => {
    if (actualIsSpeaking && !isMuted) {
      muteMicrophone();
      console.log("🔇 Muting mic during TTS to prevent echo");
      console.log(`📊 Button visibility: actualIsSpeaking=${actualIsSpeaking}, voiceStatus=${voiceStatus}, isDemoActive=${isDemoActive}`);
    }
  }, [actualIsSpeaking, isMuted, muteMicrophone, voiceStatus, isDemoActive]);

  // Handle TTS completion - unmute and restart listening
  useEffect(() => {
    if (!actualIsSpeaking && voiceStatus === "speaking" && isDemoActive) {
      unmuteMicrophone();
      setVoiceStatus("listening");
      startListening();
    } else if (!actualIsSpeaking && voiceStatus === "speaking") {
      unmuteMicrophone();
      setVoiceStatus("idle");
    }
  }, [actualIsSpeaking, voiceStatus, isDemoActive, startListening, unmuteMicrophone]);

  // Handle manual interrupt
  const handleInterrupt = () => {
    console.log("🎤 Manual interrupt! Stopping AI speech...");
    stopActualSpeaking();

    // Stop current listening if active
    if (isListening) {
      stopListening();
    }

    // Unmute microphone
    unmuteMicrophone();

    // Small delay to ensure everything is ready before restarting
    setTimeout(() => {
      setVoiceStatus("listening");
      if (!isListening) {
        startListening();
        console.log("🎤 Started listening after interrupt");
      }
    }, 200);
  };

  // Handle starting the demo
  const handleStartDemo = () => {
    setIsDemoActive(true);
    setVoiceStatus("listening");
    startListening();
  };

  // Handle stopping the demo
  const handleStopDemo = () => {
    setIsDemoActive(false);
    setVoiceStatus("idle");
    stopListening();
    stopActualSpeaking();
  };

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

    // Create placeholder for assistant message
    const assistantMessageIndex = conversationHistory.length + 1;
    let accumulatedContent = "";

    // Start TTS based on mode (avatar, ElevenLabs, or browser)
    let ttsStarted = false;
    const useAvatarForResponse = useAvatar;

    if (useElevenLabs && !useAvatar) {
      startStreaming();
      ttsStarted = true;
      setVoiceStatus("speaking");
    } else if (useAvatar) {
      setVoiceStatus("speaking");
    }

    try {
      // Using v0.3.1 view-aware API endpoint
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      // Add empty assistant message that we'll update
      setConversationHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.done) {
              // Streaming complete
              break;
            }

            // Handle metadata from v0.3.1 view-aware API
            if (data.metadata) {
              console.log('📊 v0.3.1 API Metadata:', data.metadata);
              setApiMetadata(data.metadata);
            }

            // Handle file references (incremental updates)
            if (data.type === 'file_references' && data.references) {
              console.log('📁 New file references:', data.references);
              setConversationHistory((prev) => {
                const updated = [...prev];
                if (updated[assistantMessageIndex]) {
                  const existing = updated[assistantMessageIndex].fileReferences || [];
                  // Merge new references
                  const merged = [...existing];
                  data.references.forEach((newRef: FileReference) => {
                    const exists = merged.some(r =>
                      r.path === newRef.path && r.lineNumber === newRef.lineNumber
                    );
                    if (!exists) {
                      merged.push(newRef);
                    }
                  });
                  updated[assistantMessageIndex].fileReferences = merged;
                }
                return updated;
              });
            }

            // Handle final file references
            if (data.type === 'file_references_final' && data.references) {
              console.log('📁 Final file references:', data.references);
              setConversationHistory((prev) => {
                const updated = [...prev];
                if (updated[assistantMessageIndex]) {
                  updated[assistantMessageIndex].fileReferences = data.references;
                }
                return updated;
              });
            }

            // Handle text content
            if (data.type === 'text' && data.content) {
              accumulatedContent += data.content;

              // Send to ElevenLabs WebSocket in real-time
              if (ttsStarted) {
                sendTextChunk(data.content);
              }

              // Update the assistant message in real-time
              setConversationHistory((prev) => {
                const updated = [...prev];
                updated[assistantMessageIndex] = {
                  role: "assistant",
                  content: accumulatedContent,
                  timestamp: new Date(),
                };
                return updated;
              });
            }
            // Handle diagram data
            else if (data.type === 'diagram' && data.data) {
              console.log('📊 Received diagram with', data.data.elements?.length, 'elements');
              setCurrentDiagram(data.data);

              // Attach diagram to current message
              setConversationHistory((prev) => {
                const updated = [...prev];
                if (updated[assistantMessageIndex]) {
                  updated[assistantMessageIndex].diagram = data.data;
                }
                return updated;
              });
            }
            // Legacy format support (for backward compatibility)
            else if (data.content && !data.type) {
              accumulatedContent += data.content;

              // Send to ElevenLabs WebSocket in real-time
              if (ttsStarted) {
                sendTextChunk(data.content);
              }

              // Update the assistant message in real-time
              setConversationHistory((prev) => {
                const updated = [...prev];
                updated[assistantMessageIndex] = {
                  role: "assistant",
                  content: accumulatedContent,
                  timestamp: new Date(),
                };
                return updated;
              });
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }

      // End WebSocket streaming or use avatar/fallback TTS
      if (ttsStarted) {
        endStreaming();
        // Note: We'll set back to idle when TTS finishes (handled by isSpeaking effect)
      } else if (useAvatarForResponse && accumulatedContent) {
        // Use HeyGen avatar (voice settings are applied during session creation)
        avatarSpeak(accumulatedContent);
        // Note: We'll set back to idle when TTS finishes (handled by isSpeaking effect)
      } else if (accumulatedContent) {
        // Fallback to browser TTS
        setVoiceStatus("speaking");
        speak(accumulatedContent);
        // Note: We'll set back to idle when TTS finishes (handled by isSpeaking effect)
      } else {
        setVoiceStatus("idle");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      console.error("Error sending message:", err);

      // Stop TTS if it was started
      if (ttsStarted) {
        stopElevenLabs();
      }

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
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
                fontWeight: "300",
                margin: "0",
                color: theme.colors.text,
                lineHeight: "1",
              }}
            >
              Principal AI
            </h1>
          </div>

          {isRepoLoaded && (() => {
            // Extract owner and repo from repoUrl
            const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
            const owner = match ? match[1] : '';
            const repo = match ? match[2] : '';

            return (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button
                    onClick={() => setEnableAvatar(!enableAvatar)}
                    disabled={!isAvatarSupported}
                    style={{
                      backgroundColor: enableAvatar ? theme.colors.primary : theme.colors.background,
                      color: enableAvatar ? theme.colors.background : theme.colors.text,
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      border: `1px solid ${enableAvatar ? theme.colors.primary : theme.colors.border}`,
                      cursor: isAvatarSupported ? "pointer" : "not-allowed",
                      fontSize: "0.85rem",
                      opacity: !isAvatarSupported ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    {isAvatarLoading ? "Loading Avatar..." : enableAvatar ? "Avatar Enabled" : "Enable Avatar"}
                    {!isAvatarSupported && " (API key required)"}
                  </button>
                  <button
                    onClick={() => setIsRepoLoaded(false)}
                    style={{
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      border: `1px solid ${theme.colors.border}`,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Change Repository
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {!isRepoLoaded ? (
          /* Repository Selection Section */
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              Supported Projects
            </h2>

            {error && (
              <div
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  borderRadius: "6px",
                  padding: "0.75rem",
                  marginBottom: "1.5rem",
                  color: "#fca5a5",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            {isLoading ? (
              <LoadingAnimation message="Loading repository and parsing codebase views" />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {/* Repository Card */}
                <div
                  onClick={handleLoadRepo}
                  style={{
                    backgroundColor: theme.colors.backgroundSecondary,
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: `1px solid ${theme.colors.border}`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      marginBottom: "0.75rem",
                      color: theme.colors.text,
                    }}
                  >
                    a24z-ai/core-library
                  </h3>
                  <p style={{ marginBottom: "0.75rem", color: theme.colors.textSecondary, fontSize: "0.95rem" }}>
                    Core library with Alexandria documentation including structured codebase views and guidance.
                  </p>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "4px",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid #10b981",
                      fontSize: "0.85rem",
                      color: "#10b981",
                      fontFamily: theme.fonts.monospace,
                    }}
                  >
                    .alexandria/
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Main Demo Interface - Conversation with Avatar */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Principal Engineer
                    </h2>
                    <div style={{ fontSize: "0.8rem", color: theme.colors.textSecondary }}>
                      for <span style={{ fontFamily: theme.fonts.monospace }}>{(() => {
                        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
                        return match ? match[2] : 'core-library';
                      })()}</span> by <span style={{ fontFamily: theme.fonts.monospace }}>{(() => {
                        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
                        return match ? match[1] : 'a24z-ai';
                      })()}</span>
                    </div>
                  </div>
                  {enableAvatar && isAvatarSessionActive && (
                    <button
                      onClick={() => setShowAvatarSettings(true)}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Settings size={16} /> Settings
                    </button>
                  )}
                </div>

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
                    overflow: "hidden",
                  }}
                >
                  {!enableAvatar ? (
                    <div style={{ textAlign: "center", color: theme.colors.textSecondary }}>
                      <div style={{ marginBottom: "0.5rem" }}><User size={48} /></div>
                      <div>Enable avatar to see video</div>
                    </div>
                  ) : isAvatarLoading ? (
                    <div style={{ textAlign: "center", color: theme.colors.textSecondary }}>
                      <div style={{ marginBottom: "0.5rem" }}><Clock size={48} /></div>
                      <div>Initializing avatar...</div>
                    </div>
                  ) : avatarStream ? (
                    <video
                      ref={(el) => setVideoRef(el)}
                      autoPlay
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : isAvatarSessionActive ? (
                    <div style={{ textAlign: "center", color: theme.colors.textSecondary }}>
                      <div style={{ marginBottom: "0.5rem" }}><Radio size={48} /></div>
                      <div>Waiting for video stream...</div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", color: theme.colors.textSecondary }}>
                      <div style={{ marginBottom: "0.5rem" }}><X size={48} /></div>
                      <div>Avatar session failed</div>
                      <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                        {!isAvatarSupported ? "HeyGen API key not configured" : "Check console for errors"}
                      </div>
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
                      {voiceStatus === "listening" && <><Mic size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Listening...</>}
                      {voiceStatus === "processing" && <><Cog size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Processing...</>}
                      {voiceStatus === "speaking" && <><Volume2 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Speaking...</>}
                    </span>
                  </div>

                  {/* Demo Control Button */}
                  {!isDemoActive ? (
                    <button
                      onClick={handleStartDemo}
                      disabled={!isVoiceSupported}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: !isVoiceSupported ? "#6b7280" : theme.colors.primary,
                        color: theme.colors.background,
                        cursor: !isVoiceSupported ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "1rem",
                        opacity: !isVoiceSupported ? 0.6 : 1,
                      }}
                    >
                      {!isVoiceSupported ? "Voice Not Supported" : <><Mic2 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Begin Conversation</>}
                    </button>
                  ) : (
                    <button
                      onClick={handleStopDemo}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "#ef4444",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "1rem",
                      }}
                    >
                      <Square size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Stop Conversation
                    </button>
                  )}

                  {/* Status Display */}
                  {isDemoActive && (
                    <div
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        backgroundColor: theme.colors.background,
                        textAlign: "center",
                        border: `1px solid ${theme.colors.border}`,
                        fontSize: "0.9rem",
                      }}
                    >
                      {voiceStatus === "listening" && interimTranscript && (
                        <span style={{ color: theme.colors.primary }}>&quot;{interimTranscript}...&quot;</span>
                      )}
                      {voiceStatus === "listening" && !interimTranscript && (
                        <span style={{ color: theme.colors.textSecondary }}>Listening...</span>
                      )}
                      {voiceStatus === "processing" && (
                        <span style={{ color: "#f59e0b" }}>Processing...</span>
                      )}
                      {voiceStatus === "speaking" && (
                        <span style={{ color: "#10b981" }}>Speaking...</span>
                      )}
                    </div>
                  )}

                  {/* Interrupt Button - show when speaking */}
                  {(actualIsSpeaking || voiceStatus === "speaking") && isDemoActive && (
                    <button
                      onClick={handleInterrupt}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: `2px solid #ef4444`,
                        backgroundColor: "#ef4444",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                      }}
                    >
                      <Hand size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Interrupt AI
                    </button>
                  )}
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
                {/* Tab Navigation */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <button
                    onClick={() => setActiveTab('conversation')}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1rem",
                      borderRadius: "6px",
                      border: `1px solid ${activeTab === 'conversation' ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor: activeTab === 'conversation' ? 'rgba(59, 130, 246, 0.1)' : theme.colors.background,
                      color: activeTab === 'conversation' ? theme.colors.primary : theme.colors.text,
                      cursor: "pointer",
                      fontWeight: activeTab === 'conversation' ? "600" : "500",
                      fontSize: "0.95rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <MessageCircle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Conversation
                  </button>
                  <button
                    onClick={() => setActiveTab('files')}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1rem",
                      borderRadius: "6px",
                      border: `1px solid ${activeTab === 'files' ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor: activeTab === 'files' ? 'rgba(59, 130, 246, 0.1)' : theme.colors.background,
                      color: activeTab === 'files' ? theme.colors.primary : theme.colors.text,
                      cursor: "pointer",
                      fontWeight: activeTab === 'files' ? "600" : "500",
                      fontSize: "0.95rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <Folder size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Files ({(() => {
                      const uniqueRefs = new Set<string>();
                      conversationHistory.forEach((msg) => {
                        msg.fileReferences?.forEach((ref) => {
                          uniqueRefs.add(`${ref.path}:${ref.lineNumber || ''}`);
                        });
                      });
                      return uniqueRefs.size;
                    })()})
                  </button>
                </div>

                {/* Conversation Tab Content */}
                {activeTab === 'conversation' && (
                  <>
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
                      <div style={{ marginBottom: "0.5rem" }}><MessageCircle size={48} /></div>
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
                          <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            {message.role === "user" ? <><User size={16} /> You</> : <><Bot size={16} /> Principal Engineer</>}
                          </span>
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>{message.content}</div>
                      </div>
                    ))
                  )}
                </div>
                  </>
                )}

                {/* Files Tab Content */}
                {activeTab === 'files' && (() => {
                  // Collect all file references from all messages
                  const allFileReferences: FileReference[] = [];
                  conversationHistory.forEach((message) => {
                    console.log('📂 Checking message:', { role: message.role, hasRefs: !!message.fileReferences, refCount: message.fileReferences?.length || 0 });
                    if (message.fileReferences && message.fileReferences.length > 0) {
                      message.fileReferences.forEach((ref) => {
                        // Avoid duplicates
                        const exists = allFileReferences.some(r =>
                          r.path === ref.path && r.lineNumber === ref.lineNumber
                        );
                        if (!exists) {
                          allFileReferences.push(ref);
                        }
                      });
                    }
                  });

                  console.log('📂 Total file references collected:', allFileReferences.length, allFileReferences);

                  // Extract owner and repo from repoUrl
                  let owner = "a24z-ai";
                  let repo = "alexandria-cli";
                  if (repoUrl) {
                    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
                    if (match) {
                      owner = match[1];
                      repo = match[2];
                    }
                  }

                  return (
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        maxHeight: "500px",
                        padding: "0.5rem",
                      }}
                    >
                      {allFileReferences.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            color: theme.colors.textSecondary,
                            padding: "2rem",
                          }}
                        >
                          <div style={{ marginBottom: "0.5rem" }}><Folder size={48} /></div>
                          <p>No files referenced yet.</p>
                          <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
                            File references will appear here as the AI mentions them in responses.
                          </p>
                        </div>
                      ) : (
                        <FileReferences
                          references={allFileReferences}
                          owner={owner}
                          repo={repo}
                          branch="main"
                        />
                      )}
                    </div>
                  );
                })()}

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

            {/* Diagram Panel - Only show when diagram is available */}
            {currentDiagram && (
              <div
                style={{
                  backgroundColor: theme.colors.backgroundSecondary,
                  padding: "1.5rem",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <BarChart3 size={20} /> Visual Diagram
                </h3>

                <ExcalidrawViewer
                  diagram={currentDiagram}
                  theme="light"
                  height="600px"
                />

                <p
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.85rem",
                    color: theme.colors.textSecondary,
                  }}
                >
                  This diagram was automatically generated based on the AI&apos;s response.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Avatar Settings Modal */}
        <AvatarSettingsModal
          isOpen={showAvatarSettings}
          onClose={() => setShowAvatarSettings(false)}
          voiceEmotion={voiceEmotion}
          setVoiceEmotion={setVoiceEmotion}
          voiceRate={voiceRate}
          setVoiceRate={setVoiceRate}
        />
      </div>
    </div>
  );
}
