"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { FrameProvider } from "./providers/FrameProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Toaster position="top-center" />
      <FrameProvider>
        {children}
      </FrameProvider>
    </ThemeProvider>
  );
}

// Global tip tanımlaması
declare global {
  interface Window {
    IS_WARPCAST_ENV?: boolean;
  }
}
