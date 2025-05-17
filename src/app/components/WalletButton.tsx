"use client";

import React from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { useMiniAppContext } from "../hooks/useMiniAppContext";
import { useSwitchChain } from "wagmi";

export default function WalletButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [copied, setCopied] = React.useState(false);
  
  // Import context but suppress unused variable warnings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isEthProviderAvailable, isSDKLoaded } = useMiniAppContext();

  function isInMiniApp() {
    return typeof window !== 'undefined' && window.parent !== window;
  }

  // Check if we're on the right chain when wallet is connected
  React.useEffect(() => {
    if (isConnected && chainId !== monadTestnet.id) {
      // Try to switch chain, ignore any errors
      try {
        switchChain({ chainId: monadTestnet.id });
      } catch (error: unknown) {
        // Silent error handling - don't show errors to user
        console.log("Chain switch failed:", error);
      }
    }
  }, [isConnected, chainId, switchChain]);

  // Connected state - show same UI in all environments
  if (isConnected) {
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white shadow border border-gray-700">
        <span
          className="font-mono text-base cursor-pointer select-all"
          onClick={() => {
            if (address) {
              navigator.clipboard.writeText(address);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }
          }}
          title={address}
        >
          {shortAddress}
        </span>
        <button
          onClick={() => disconnect()}
          className="ml-2 p-1 rounded hover:bg-gray-800 transition-colors"
          title="Disconnect"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
        </button>
        {copied && <span className="ml-2 text-xs text-green-400">Copied!</span>}
      </div>
    );
  }

  // Not connected - use the appropriate connector based on environment
  const handleConnectWallet = () => {
    if (isInMiniApp()) {
      // In Warpcast - use Frame connector
      const frameConnector = connectors.find(c => c.id === 'farcasterFrame');
      if (frameConnector) {
        connect({ connector: frameConnector });
      }
    } else {
      // In browser - use injected connector (MetaMask, etc.)
      const injectedConnector = connectors.find(c => c.id === 'injected');
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    }
  };

  return (
    <button
      onClick={handleConnectWallet}
      className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-purple-700 text-white hover:bg-purple-800 justify-center w-full"
    >
      Connect Wallet
    </button>
  );
}
