"use client";

import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";
import { useState, useEffect } from "react";
import { client } from "@/lib/appwrite";

export default function AppwriteTestPage() {
  const { theme } = useTheme();
  const [status, setStatus] = useState("idle");
  const [connectionInfo, setConnectionInfo] = useState(null);

  const testConnection = async () => {
    setStatus("loading");
    try {
      const result = await client.ping();
      setConnectionInfo({
        status: "success",
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        projectName: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME,
        response: result,
      });
      setStatus("success");
    } catch (error) {
      setConnectionInfo({
        status: "error",
        error: error.message,
      });
      setStatus("error");
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
          Appwrite Database Test
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          Testing Appwrite database connection and session management
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
            ✅ Appwrite client configured
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ⏳ Database collections pending
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ⏳ Session storage pending
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
            Connection Test
          </h2>
          <button
            onClick={testConnection}
            disabled={status === "loading"}
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              border: "none",
              cursor: status === "loading" ? "not-allowed" : "pointer",
              fontWeight: "500",
              fontSize: "1rem",
              opacity: status === "loading" ? 0.5 : 1,
            }}
          >
            {status === "loading" ? "Testing..." : "Test Connection"}
          </button>
        </div>

        {connectionInfo && (
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
              Connection Result
            </h2>
            <div
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                backgroundColor:
                  connectionInfo.status === "success"
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                borderRadius: "6px",
                color:
                  connectionInfo.status === "success"
                    ? "#10b981"
                    : "#ef4444",
                fontWeight: "600",
              }}
            >
              {connectionInfo.status === "success" ? "✅ Connected" : "❌ Connection Failed"}
            </div>
            <pre
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: "0.9rem",
                overflow: "auto",
                padding: "1rem",
                backgroundColor: theme.colors.background,
                borderRadius: "4px",
              }}
            >
              {JSON.stringify(connectionInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
