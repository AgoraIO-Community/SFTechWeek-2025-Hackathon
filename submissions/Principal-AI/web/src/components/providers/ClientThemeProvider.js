"use client";

import React from "react";
import { ThemeProvider, regalTheme } from "@a24z/industry-theme";

export default function ClientThemeProvider({ children }) {
  return (
    <ThemeProvider theme={regalTheme}>
      {children}
    </ThemeProvider>
  );
}
