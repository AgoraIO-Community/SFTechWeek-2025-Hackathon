"use client";

import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";
import { useState } from "react";

export default function LLMTestPage() {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSendMessage = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          status: "error",
          error: data.error || "Request failed",
        });
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({
        status: "error",
        error: error.message || "Network error",
      });
    } finally {
      setLoading(false);
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
          LLM Service Test (Groq)
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          Testing LLM integration with context injection and response generation
        </p>

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
            ✅ Groq API integration (@principal-ade/ai-brain)
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ✅ Context retrieval (MemoryPalace + GitHub)
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ✅ Prompt engineering (codebase views + guidance)
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ✅ Response generation (llama-3.3-70b-versatile)
          </div>
        </div>

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
            Send Message
          </h2>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question about the codebase..."
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontSize: "1rem",
                fontFamily: theme.fonts.body,
                resize: "vertical",
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={loading || !message}
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              border: "none",
              cursor: loading || !message ? "not-allowed" : "pointer",
              fontWeight: "500",
              fontSize: "1rem",
              opacity: loading || !message ? 0.5 : 1,
            }}
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </div>

        {result && (
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
              Response
            </h2>
            {result.status === "error" ? (
              <div
                style={{
                  color: "#ef4444",
                  padding: "1rem",
                  backgroundColor: theme.colors.background,
                  borderRadius: "4px",
                  marginBottom: "1rem",
                }}
              >
                ❌ Error: {result.error}
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: theme.colors.background,
                    borderRadius: "4px",
                    marginBottom: "1rem",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                  }}
                >
                  {result.response}
                </div>
                {result.metadata && (
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: theme.colors.textSecondary,
                      marginTop: "1rem",
                    }}
                  >
                    Repository: {result.metadata.repository} • Loaded{" "}
                    {result.metadata.views} codebase views
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
