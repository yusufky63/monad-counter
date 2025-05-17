"use client";

import React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function isWarpcastEnv() {
  if (typeof window === 'undefined') return false;
  return window.parent !== window || window.IS_WARPCAST_ENV;
}

export default function WalletButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isWarpcastEnv()) {
    return null; // Warpcast içindeyse cüzdan bağlantısı gösterme
  }

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-gray-800 text-white">
        <span>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white mt-2"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-purple-700 text-white hover:bg-purple-800"
      >
        Connect Wallet
      </button>
      <a
        href={`https://warpcast.com/~/embed?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-[#624DE3] text-white hover:bg-[#5341D2] justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
        Sign in with Warpcast
      </a>
    </div>
  );
}
