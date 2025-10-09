"use client";

import "./app.css";
import "@appwrite.io/pink-icons";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@a24z/industry-theme";
import { client } from "@/lib/appwrite";
import { AppwriteException } from "appwrite";

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
      className="flex flex-col items-center p-5"
      style={{
        marginBottom: `${detailHeight}px`,
        backgroundColor: theme.colors.background,
        minHeight: "100vh",
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
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
          className="text-2xl mb-4"
          style={{ color: theme.colors.textSecondary }}
        >
          Voice-powered AI Principal Engineer for your codebase
        </p>
        <p
          className="text-lg mb-12"
          style={{ color: theme.colors.textSecondary, opacity: 0.8 }}
        >
          Have natural conversations with an AI that understands your repository structure and codebase context
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
              Launch Demo
            </button>
          </a>

          <a href="/integrations" style={{ textDecoration: "none" }}>
            <button
              className="px-8 py-4 rounded-lg text-lg font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                color: theme.colors.text,
                border: `2px solid ${theme.colors.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              View Integrations
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          {[
            { title: "Agora Voice", desc: "Real-time voice I/O and speech-to-text with WebRTC" },
            { title: "Alexandria", desc: "Structured codebase context from .alexandria/ documentation" },
            { title: "Groq LLM", desc: "Ultra-fast inference with llama-3.1-8b-instant for real-time responses" },
            { title: "ElevenLabs TTS", desc: "Natural voice synthesis for professional-quality audio" },
            { title: "HeyGen Avatar", desc: "Photorealistic AI avatar with lip-sync and streaming video" },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                padding: "1.5rem",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.backgroundSecondary,
              }}
            >
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", color: theme.colors.text }}>
                {feature.title}
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: "0.95rem" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <aside
        className="fixed bottom-0 flex w-full cursor-pointer"
        style={{
          borderTop: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundSecondary,
        }}
      >
        <details open={showLogs} ref={detailsRef} className={"w-full"}>
          <summary
            className="flex w-full flex-row justify-between p-4 marker:content-none"
            style={{ color: theme.colors.text }}
          >
            <div className="flex gap-2">
              <span className="font-semibold">Logs</span>
              {logs.length > 0 && (
                <div
                  className="flex items-center rounded-md px-2"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                  }}
                >
                  <span className="font-semibold">{logs.length}</span>
                </div>
              )}
            </div>
            <div className="icon">
              <span className="icon-cheveron-down" aria-hidden="true"></span>
            </div>
          </summary>
          <div className="flex w-full flex-col lg:flex-row">
            <div
              className="flex flex-col"
              style={{ borderRight: `1px solid ${theme.colors.border}` }}
            >
              <div
                className="px-4 py-2"
                style={{
                  borderTop: `1px solid ${theme.colors.border}`,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textSecondary,
                }}
              >
                Project
              </div>
              <div className="grid grid-cols-2 gap-4 p-4">
                <div className="flex flex-col">
                  <span style={{ color: theme.colors.textSecondary }}>Endpoint</span>
                  <span className="truncate" style={{ color: theme.colors.text }}>
                    {process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span style={{ color: theme.colors.textSecondary }}>Project-ID</span>
                  <span className="truncate" style={{ color: theme.colors.text }}>
                    {process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span style={{ color: theme.colors.textSecondary }}>Project name</span>
                  <span className="truncate" style={{ color: theme.colors.text }}>
                    {process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-grow">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      borderTop: `1px solid ${theme.colors.border}`,
                      borderBottom: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.background,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {logs.length > 0 ? (
                      <>
                        <td className="w-52 py-2 pl-4">Date</td>
                        <td>Status</td>
                        <td>Method</td>
                        <td className="hidden lg:table-cell">Path</td>
                        <td className="hidden lg:table-cell">Response</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pl-4">Logs</td>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <tr key={`log-${index}-${log.date.getTime()}`} style={{ color: theme.colors.text }}>
                        <td className="py-2 pl-4" style={{ fontFamily: theme.fonts.monospace }}>
                          {log.date.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          {log.status > 400 ? (
                            <div
                              className="w-fit rounded-sm px-1"
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.2)",
                                color: "#ef4444",
                              }}
                            >
                              {log.status}
                            </div>
                          ) : (
                            <div
                              className="w-fit rounded-sm px-1"
                              style={{
                                backgroundColor: "rgba(16, 185, 129, 0.2)",
                                color: "#10b981",
                              }}
                            >
                              {log.status}
                            </div>
                          )}
                        </td>
                        <td>{log.method}</td>
                        <td className="hidden lg:table-cell">{log.path}</td>
                        <td className="hidden lg:table-cell" style={{ fontFamily: theme.fonts.monospace }}>
                          {log.response}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key="no-logs">
                      <td className="py-2 pl-4" style={{ fontFamily: theme.fonts.monospace, color: theme.colors.text }}>
                        There are no logs to show
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </aside>
    </main>
  );
}
