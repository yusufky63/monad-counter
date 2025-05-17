"use client";

import React from 'react';
import { useMiniAppContext } from "../hooks/useMiniAppContext";

// Set the app URL for sharing - using specific Vercel deployment
const APP_URL = "https://monad-counter.vercel.app";

function isWarpcastEnv() {
  if (typeof window === 'undefined') return false;
  return window.parent !== window;
}

export function FarcasterShareButton({ counterValue }: { counterValue: string }) {
  const { actions } = useMiniAppContext();

  if (!isWarpcastEnv() || !actions) return null;

  const handleShare = async () => {
    await actions.composeCast({
      text: `I just incremented the Monad Counter to ${counterValue}! 🚀\nTry it yourself:`,
      embeds: [`${APP_URL}`]
    });
  };

  return (
    <button 
      onClick={handleShare}
      className="bg-[#9747FF] hover:bg-[#8A32FF] text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 w-full text-sm font-medium shadow transition-all duration-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
      Share
      <span className="font-mono text-white bg-purple-500/40 px-1.5 py-0.5 rounded text-xs">
        {counterValue}
      </span>
    </button>
  );
}

export function FarcasterShareFooter({ counterValue }: { counterValue: string }) {
  if (!isWarpcastEnv()) return null;
  
  return (
    <div className="w-full flex justify-center mt-4">
      <div className="max-w-xs w-full">
        <FarcasterShareButton counterValue={counterValue} />
      </div>
    </div>
  );
} 