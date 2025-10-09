"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";

// Dynamically import AgoraRTC to avoid SSR issues
const AgoraTestComponent = dynamic(() => import("./AgoraTestComponent"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      Loading Agora SDK...
    </div>
  ),
});

export default function AgoraTestPage() {
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
          Agora Voice Engine Test
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          Testing real-time voice I/O and audio streaming with Agora SDK
        </p>

        <AgoraTestComponent />
      </div>
    </div>
  );
}
