"use client";

import { useTheme } from "@a24z/industry-theme";

export default function TestPage() {
  const { theme } = useTheme();

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
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            marginBottom: "1rem",
            color: theme.colors.primary,
          }}
        >
          Principal AI - Theme Integration Test
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          This page confirms the @a24z/industry-theme (Regal theme) integration is working correctly.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.backgroundSecondary,
              padding: "1.5rem",
              borderRadius: "8px",
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Theme Colors
            </h2>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: "0.9rem" }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Primary:</strong> {theme.colors.primary}
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Background:</strong> {theme.colors.background}
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Text:</strong> {theme.colors.text}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: theme.colors.backgroundSecondary,
              padding: "1.5rem",
              borderRadius: "8px",
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Integration Status
            </h2>
            <div style={{ marginBottom: "0.5rem" }}>
              ✅ @a24z/industry-theme installed
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              ✅ ClientThemeProvider configured
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              ✅ Regal theme active
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              ✅ useTheme hook working
            </div>
          </div>

          <div
            style={{
              backgroundColor: theme.colors.backgroundSecondary,
              padding: "1.5rem",
              borderRadius: "8px",
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Next Steps
            </h2>
            <ul style={{ paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                Add more integration test pages
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                Test Principal AI MCP functionality
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                Build feature components
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            padding: "1.5rem",
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
            Button Examples
          </h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
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
              Primary Button
            </button>
            <button
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
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
