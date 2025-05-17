import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Monad Counter",
  description: "An on-chain counter app powered by Monad blockchain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* OpenGraph & Twitter Meta Tags */}
        <meta property="og:title" content="Monad Counter" />
        <meta property="og:description" content="On-chain counter mini-app for Monad and Farcaster." />
        <meta property="og:image" content="https://monad-counter.vercel.app/images/feed.png" />
        <meta property="og:url" content="https://monad-counter.vercel.app/" />
        <meta name="twitter:card" content="summary_large_image" />
        {/* Farcaster Mini App Embed Meta */}
        <meta name="fc:frame" content='{"version":"next","imageUrl":"https://monad-counter.vercel.app/images/feed.png","button":{"title":"Launch Counter","action":{"type":"launch_frame","name":"Monad Counter","url":"https://monad-counter.vercel.app","splashImageUrl":"https://monad-counter.vercel.app/images/splash.png","splashBackgroundColor":"#181028"}}}' />
      </head>
      <body>
        <Providers>
          <ThemeProvider>
            {children}
            <Toaster position="top-center" />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
