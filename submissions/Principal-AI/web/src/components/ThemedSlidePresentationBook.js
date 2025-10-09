"use client";

import React from "react";
import { SlidePresentationBook } from "themed-markdown";
import { useTheme } from "@a24z/industry-theme";
import mermaid from "mermaid";
import "themed-markdown/dist/index.css";

export const ThemedSlidePresentationBook = (props) => {
  const { theme } = useTheme();

  // Initialize mermaid
  React.useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    });
    // Expose mermaid to window for themed-markdown
    window.mermaid = mermaid;
  }, []);

  return <SlidePresentationBook {...props} theme={theme} />;
};
