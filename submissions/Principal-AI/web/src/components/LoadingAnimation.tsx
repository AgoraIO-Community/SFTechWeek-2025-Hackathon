"use client";

import { useTheme } from "@a24z/industry-theme";
import { useEffect, useState } from "react";

interface LoadingAnimationProps {
  message?: string;
}

export function LoadingAnimation({ message = "Loading..." }: LoadingAnimationProps) {
  const { theme } = useTheme();
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        gap: "1.5rem",
      }}
    >
      {/* Animated circles */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: theme.colors.primary,
              animation: `bounce 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      <div
        style={{
          fontSize: "1.1rem",
          color: theme.colors.textSecondary,
          fontWeight: "500",
        }}
      >
        {message}
        {dots}
      </div>

      {/* Add keyframes */}
      <style jsx>{`
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
