"use client";

import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";
import { useState } from "react";

export default function GitHubTestPage() {
  const { theme } = useTheme();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleLoadRepo = async () => {
    setLoading(true);
    setResult(null);

    // TODO: Implement actual API call
    setTimeout(() => {
      setResult({
        status: "pending",
        message: "API endpoint /api/load-repo not yet implemented"
      });
      setLoading(false);
    }, 1000);
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
          GitHub Loader Test
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          Testing GitHub repository loading and document parsing
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
            ⏳ @principal/core package pending
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ⏳ GitHub API integration pending
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            ⏳ Document parser pending
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
            Load Repository
          </h2>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontSize: "1rem",
                fontFamily: theme.fonts.body,
              }}
            />
          </div>
          <button
            onClick={handleLoadRepo}
            disabled={loading || !repoUrl}
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              border: "none",
              cursor: loading || !repoUrl ? "not-allowed" : "pointer",
              fontWeight: "500",
              fontSize: "1rem",
              opacity: loading || !repoUrl ? 0.5 : 1,
            }}
          >
            {loading ? "Loading..." : "Load Repository"}
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
              Result
            </h2>
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
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
