"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@a24z/industry-theme";
import Link from "next/link";
import { ThemedSlidePresentationBook } from "@/components/ThemedSlidePresentationBook";
import { parseMarkdownIntoPresentation } from "themed-markdown";

interface TestLink {
  href: string;
  title: string;
  desc: string;
}

export default function IntegrationsPage() {
  const { theme } = useTheme();
  const [slides, setSlides] = useState<string[]>([]);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
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

  // Fetch markdown content
  useEffect(() => {
    fetch("/implementation-plan.md")
      .then((response) => response.text())
      .then((text) => {
        console.log("Loaded markdown content:", text);
        try {
          const presentation = parseMarkdownIntoPresentation(text);
          console.log("Parsed presentation:", presentation);
          const parsedSlides = (presentation?.slides || []).map((s) => s.location.content);
          console.log("Parsed slides:", parsedSlides);
          setSlides(parsedSlides);
        } catch (error) {
          console.error("Error parsing markdown:", error);
          setSlides([text]); // Fallback to single slide
        }
      })
      .catch((error) => console.error("Error loading markdown:", error));
  }, []);

  const testLinks: TestLink[] = [
    { href: "/agora-test", title: "Agora Voice", desc: "Test real-time voice I/O and audio streaming" },
    { href: "/elevenlabs-test", title: "ElevenLabs TTS", desc: "Test text-to-speech voice synthesis" },
    { href: "/heygen-test", title: "HeyGen Avatar", desc: "Test video streaming and lip-sync rendering" },
    { href: "/github-test", title: "GitHub Loader", desc: "Test repository loading and document parsing" },
    { href: "/llm-test", title: "LLM Service", desc: "Test Groq LLM and context injection" },
    { href: "/appwrite-test", title: "Appwrite DB", desc: "Test database connection and session storage" },
    { href: "/test", title: "Theme Test", desc: "Test @a24z/industry-theme integration" },
  ];

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
          Integrations & Testing
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: theme.colors.textSecondary,
          }}
        >
          Test individual components and view the implementation plan
        </p>

        {/* Implementation Plan Viewer */}
        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Implementation Plan
          </h2>
          <div
            style={{
              width: "100%",
              height: "600px",
              border: `2px solid ${theme.colors.border}`,
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative",
              backgroundColor: theme.colors.backgroundSecondary,
            }}
          >
            {!isClient || slides.length === 0 ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.colors.textSecondary,
                  backgroundColor: theme.colors.backgroundSecondary,
                  zIndex: 10,
                }}
              >
                Loading presentation...
              </div>
            ) : null}
            <div
              style={{
                opacity: isClient && slides.length > 0 ? 1 : 0,
                transition: "opacity 0.3s ease-in",
                height: "100%",
              }}
            >
              {slides.length > 0 && (
                <ThemedSlidePresentationBook
                  slides={slides}
                  viewMode="single"
                  showNavigation={true}
                  showSlideCounter={true}
                  showFullscreenButton={true}
                  containerHeight="100%"
                />
              )}
            </div>
          </div>
        </section>

        {/* Integration Tests */}
        <section>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Integration Tests
          </h2>
          <p style={{ marginBottom: "1.5rem", color: theme.colors.textSecondary }}>
            Test each partner technology integration individually
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {testLinks.map((item) => (
              <a key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.backgroundSecondary,
                    cursor: "pointer",
                    transition: "border-color 0.2s, transform 0.2s",
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "300", color: theme.colors.text }}>
                      {item.title}
                    </h3>
                    <span className="icon-arrow-right" style={{ color: theme.colors.textSecondary }}></span>
                  </div>
                  <p style={{ color: theme.colors.textSecondary, fontSize: "0.95rem" }}>{item.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
