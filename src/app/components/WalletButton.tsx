"use client";

import React from "react";
import { useAccount, useConnect } from "wagmi";

export default function WalletButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white">
        <span>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-700 text-white hover:bg-purple-800"
    >
      Connect Wallet
    </button>
  );
}
