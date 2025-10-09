"use client";

import "./app.css";
import "@appwrite.io/pink-icons";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@a24z/industry-theme";
import { Book, Github } from "lucide-react";
import { client } from "@/lib/appwrite";
import { AppwriteException } from "appwrite";
import Image from "next/image";

interface LogEntry {
  date: Date;
  method: string;
  path: string;
  status: number;
  response: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const { theme } = useTheme();
  const [detailHeight, setDetailHeight] = useState<number>(55);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const detailsRef = useRef<HTMLDetailsElement>(null);

  const updateHeight = useCallback(() => {
    if (detailsRef.current) {
      setDetailHeight(detailsRef.current.clientHeight);
    }
  }, [logs, showLogs]);

  useEffect(() => {
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [updateHeight]);

  useEffect(() => {
    if (!detailsRef.current) return;
    detailsRef.current.addEventListener("toggle", updateHeight);

    return () => {
      if (!detailsRef.current) return;
      detailsRef.current.removeEventListener("toggle", updateHeight);
    };
  }, []);

  // Set body and html background color to match theme
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

  async function sendPing(): Promise<void> {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const result = await client.ping();
      const log: LogEntry = {
        date: new Date(),
        method: "GET",
        path: "/v1/ping",
        status: 200,
        response: JSON.stringify(result),
      };
      setLogs((prevLogs) => [log, ...prevLogs]);
      setStatus("success");
    } catch (err) {
      const log: LogEntry = {
        date: new Date(),
        method: "GET",
        path: "/v1/ping",
        status: err instanceof AppwriteException ? err.code : 500,
        response:
          err instanceof AppwriteException
            ? err.message
            : "Something went wrong",
      };
      setLogs((prevLogs) => [log, ...prevLogs]);
      setStatus("error");
    }
    setShowLogs(true);
  }

  return (
    <main
      className="flex flex-col items-center"
      style={{
        backgroundColor: theme.colors.background,
        minHeight: "100vh",
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        padding: "1.25rem",
      }}
    >
      {/* Hidden ping section - keeping functionality for testing */}
      <div style={{ display: "none" }}>
        <section className="mt-12 flex flex-col items-center">
          {status === "loading" ? (
            <div className="flex flex-row gap-4" style={{ color: theme.colors.text }}>
              <span>Waiting for connection...</span>
            </div>
          ) : status === "success" ? (
            <h1 className="font-[Poppins] text-2xl font-light" style={{ color: theme.colors.text }}>
              Congratulations!
            </h1>
          ) : (
            <h1 className="font-[Poppins] text-2xl font-light" style={{ color: theme.colors.text }}>
              Check connection
            </h1>
          )}

          <p className="mt-2 mb-8" style={{ color: theme.colors.textSecondary }}>
            {status === "success" ? (
              <span>You connected your app successfully.</span>
            ) : status === "error" || status === "idle" ? (
              <span>Send a ping to verify the connection</span>
            ) : null}
          </p>

          <button
            onClick={sendPing}
            className={`cursor-pointer rounded-md px-2.5 py-1.5 ${status === "loading" ? "hidden" : "visible"}`}
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
            }}
          >
            <span>Send a ping</span>
          </button>
        </section>
      </div>

      {/* Hero Section */}
      <section className="mt-12 mb-16 w-full max-w-5xl px-4 text-center">
        <h1
          className="text-6xl font-light mb-6"
          style={{ color: theme.colors.text }}
        >
          Principal AI
        </h1>
        <p
          className="text-2xl mb-12"
          style={{ color: theme.colors.textSecondary }}
        >
          Voice-powered AI Principal Engineer for your codebase
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/demo" style={{ textDecoration: "none" }}>
            <button
              className="px-8 py-4 rounded-lg text-lg font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.background,
                border: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Explore
            </button>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl px-4 mb-16">
        <h2
          className="text-3xl font-light mb-8 text-center"
          style={{ color: theme.colors.text }}
        >
          Powered by Leading AI Technologies
        </h2>
        <div>
          {/* Agora - centered single item */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <a
              href="https://www.agora.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", minWidth: "250px", maxWidth: "350px", flex: "1 1 250px" }}
            >
              <div
                className="transition-all cursor-pointer"
                style={{
                  padding: "1.5rem",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.backgroundSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 8px 16px rgba(0, 0, 0, 0.2)`;
                  e.currentTarget.style.borderColor = theme.colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = theme.colors.border;
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <div style={{ color: theme.colors.primary, display: "flex", alignItems: "center" }}>
                    <Image src="/agora.png" alt="Agora" width={80} height={32} style={{ objectFit: "contain" }} />
                  </div>
                </div>
                <p style={{ color: theme.colors.textSecondary, fontSize: "0.95rem", textAlign: "center" }}>Real-time voice I/O and speech-to-text with WebRTC</p>
              </div>
            </a>
          </div>

          {/* First row - 3 items */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {[
              {
                title: "Appwrite",
                desc: "Cloud database and session management for conversation state",
                icon: <Image src="/appwrite.svg" alt="Appwrite" width={24} height={24} style={{ objectFit: "contain" }} />,
                logoOnly: false,
                url: "https://appwrite.io"
              },
              {
                title: "Alexandria CLI",
                desc: "Structured codebase context from .alexandria/ documentation",
                icon: <Book size={24} />,
                logoOnly: false,
                url: "https://github.com/yourusername/alexandria-cli"
              },
              {
                title: "LLM",
                desc: "Ultra-fast inference with llama-3.1-8b-instant for real-time responses",
                icon: <Image src="/groq.png" alt="Groq" width={24} height={24} style={{ objectFit: "contain" }} />,
                logoOnly: false,
                url: "https://groq.com"
              },
            ].map((feature) => (
              <a
                key={feature.title}
                href={feature.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="transition-all cursor-pointer"
                  style={{
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.backgroundSecondary,
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 8px 16px rgba(0, 0, 0, 0.2)`;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    {feature.icon && <div style={{ color: theme.colors.primary, display: "flex", alignItems: "center" }}>{feature.icon}</div>}
                    {!feature.logoOnly && (
                      <h3 style={{ fontSize: "1.25rem", fontWeight: "600", margin: "0", color: theme.colors.text }}>
                        {feature.title}
                      </h3>
                    )}
                  </div>
                  <p style={{ color: theme.colors.textSecondary, fontSize: "0.95rem", textAlign: "center" }}>{feature.desc}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Second row - 2 items centered */}
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            {[
              {
                title: "ElevenLabs TTS",
                desc: "Natural voice synthesis for professional-quality audio",
                icon: <Image src="/elevenlabs.svg" alt="ElevenLabs" width={120} height={30} style={{ objectFit: "contain", paddingTop: "0.3rem", paddingBottom: "0.5rem" }} />,
                logoOnly: true,
                url: "https://elevenlabs.io"
              },
              {
                title: "HeyGen Avatar",
                desc: "Photorealistic AI avatar with lip-sync and streaming video",
                icon: <Image src="/heygen.png" alt="HeyGen" width={24} height={24} style={{ objectFit: "contain" }} />,
                logoOnly: false,
                url: "https://heygen.com"
              },
            ].map((feature) => (
              <a
                key={feature.title}
                href={feature.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", minWidth: "250px", maxWidth: "350px", flex: "1 1 250px" }}
              >
                <div
                  className="transition-all cursor-pointer"
                  style={{
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.backgroundSecondary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 8px 16px rgba(0, 0, 0, 0.2)`;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    {feature.icon && <div style={{ color: theme.colors.primary, display: "flex", alignItems: "center" }}>{feature.icon}</div>}
                    {!feature.logoOnly && (
                      <h3 style={{ fontSize: "1.25rem", fontWeight: "600", margin: "0", color: theme.colors.text }}>
                        {feature.title}
                      </h3>
                    )}
                  </div>
                  <p style={{ color: theme.colors.textSecondary, fontSize: "0.95rem", textAlign: "center" }}>{feature.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
