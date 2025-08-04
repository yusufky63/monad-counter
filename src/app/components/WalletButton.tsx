"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useWalletClient,
} from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { useSwitchChain } from "wagmi";

export default function WalletButton() {
  const { isConnected, address, status: walletStatus } = useAccount();
  const {
    connect,
    connectors,
    status: connectStatus,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [manualDisconnect, setManualDisconnect] = useState(false);
  const disconnectTimeRef = useRef<number | null>(null);

  // Determine if we're in Warpcast environment
  function isInWarpcast() {
    return typeof window !== "undefined" && window.parent !== window;
  }

  // Listen for account changes
  useEffect(() => {
    // Reset connecting state when wallet status changes
    if (walletStatus === "connected") {
      setIsConnecting(false);
      setConnectionAttempts(0);
    } else if (walletStatus === "disconnected" && isConnecting) {
      // If we were connecting but now disconnected, connection might have failed
      setTimeout(() => {
        setIsConnecting(false);
      }, 1000);
    }
  }, [walletStatus, isConnecting]);

  // Listen for connection errors
  useEffect(() => {
    if (connectError) {
      console.error("Connection error:", connectError);
      setIsConnecting(false);
      // Reset connection attempts on error
      setConnectionAttempts(0);
    }
  }, [connectError]);

  // Auto-connect only once on mount with retry mechanism
  useEffect(() => {
    // Skip auto-connect when manual disconnect is active
    if (isConnected || isConnecting || manualDisconnect) return;

    // Check for recent manual disconnect (within last 60 seconds)
    const now = Date.now();
    if (disconnectTimeRef.current && now - disconnectTimeRef.current < 60000) {
      console.log("Skipping auto-connect due to recent manual disconnect");
      return;
    }

    const autoConnect = async () => {
      try {
        setIsConnecting(true);
        if (isInWarpcast()) {
          // In Warpcast, always use farcaster connector
          const farcasterConnector = connectors.find(
            (c) => c.id === "farcaster"
          );
          if (farcasterConnector) {
            await connect({ connector: farcasterConnector });
          }
        } else {
          // In browser, try injected connector (MetaMask)
          const injectedConnector = connectors.find((c) => c.id === "injected");
          if (injectedConnector) {
            await connect({ connector: injectedConnector });
          }
        }
      } catch (error) {
        console.log("Auto-connect failed:", error);
        // Implement retry with backoff for auto-connect
        const maxRetries = 3;
        if (connectionAttempts < maxRetries) {
          setConnectionAttempts((prev) => prev + 1);
          const backoffDelay = Math.pow(2, connectionAttempts) * 1000; // Exponential backoff
          setTimeout(() => {
            setIsConnecting(false); // Reset state to allow retry
          }, backoffDelay);
        } else {
          setIsConnecting(false);
          setConnectionAttempts(0);
        }
      }
    };

    autoConnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connect,
    connectors,
    isConnected,
    manualDisconnect,
    // Removed isConnecting and connectionAttempts from dependencies to prevent loops
  ]);

  // Separate useEffect to handle connection attempts and prevent loops
  useEffect(() => {
    if (connectionAttempts > 0 && !isConnecting && !isConnected) {
      const maxRetries = 3;
      if (connectionAttempts < maxRetries) {
        const backoffDelay = Math.pow(2, connectionAttempts) * 1000;
        const timer = setTimeout(() => {
          // Only retry if still not connected
          if (!isConnected) {
            console.log(`Retrying connection attempt ${connectionAttempts + 1}/${maxRetries}`);
            setIsConnecting(true);
          }
        }, backoffDelay);
        
        return () => clearTimeout(timer);
      } else {
        // Reset after max retries
        setConnectionAttempts(0);
        setIsConnecting(false);
      }
    }
  }, [connectionAttempts, isConnecting, isConnected]);

  // Check if we're on the right chain when wallet is connected
  useEffect(() => {
    if (isConnected && chainId !== monadTestnet.id) {
      try {
        // Only try to switch chain if we're not using Farcaster connector
        // Farcaster connector handles chain switching differently
        if (!isInWarpcast()) {
          switchChain({ chainId: monadTestnet.id });
        }
      } catch (error) {
        console.log("Chain switch failed:", error);
      }
    }
  }, [isConnected, chainId, switchChain]);

  // Reset connection state if stuck (safety mechanism)

  // Check wallet client state changes
  useEffect(() => {
    if (walletClient && !isConnected) {
      // We have a wallet client but not connected - this might be a state mismatch
      console.log(
        "Wallet client available but not connected. Refreshing state..."
      );
      // Force refresh the connection state
      setIsConnecting(false);
    }
  }, [walletClient, isConnected]);

  // Handle manual connection
  const handleConnect = async () => {
    if (isConnecting) return;

    // Reset state first
    setIsConnecting(true);
    setConnectionAttempts(0);
    setManualDisconnect(false);

    try {
      if (isInWarpcast()) {
        // In Warpcast, always use farcaster connector
        const farcasterConnector = connectors.find((c) => c.id === "farcaster");
        if (farcasterConnector) {
          await connect({ connector: farcasterConnector });
        } else {
          throw new Error("Farcaster connector not found");
        }
      } else {
        // Try injected connector first (MetaMask)
        const injectedConnector = connectors.find((c) => c.id === "injected");
        if (injectedConnector) {
          await connect({ connector: injectedConnector });
        } else {
          // Try any connector
          const availableConnector = connectors.find(
            (c) => c.id !== "farcaster"
          );
          if (availableConnector) {
            await connect({ connector: availableConnector });
          } else {
            alert(
              "No wallet connection found. Please make sure MetaMask is installed."
            );
            setIsConnecting(false);
          }
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
      
      // Handle Farcaster specific errors
      if (isInWarpcast() && error instanceof Error) {
        if (error.message.includes("unauthorized") || error.message.includes("not been authorized")) {
          console.log("Farcaster wallet authorization required");
          // In Farcaster, this might be expected - user needs to authorize
        } else if (error.message.includes("Farcaster connector not found")) {
          console.error("Farcaster connector not available");
        }
      }
      
      setIsConnecting(false);
    }
  };

  // Handle disconnection
  const handleDisconnect = () => {
    // Set manual disconnect flag to prevent auto-reconnect
    setManualDisconnect(true);
    // Store disconnect time
    disconnectTimeRef.current = Date.now();
    // Reset connection attempts
    setConnectionAttempts(0);
    // Actually disconnect
    disconnect();

    // Explicitly reset state in case disconnect callback is delayed
    setTimeout(() => {
      setIsConnecting(false);
    }, 1000);
  };

  // Connected state - show address and disconnect button
  if (isConnected) {
    const shortAddress = address
      ? `${address.slice(0, 3)}...${address.slice(-2)}`
      : "";
    const isCorrectChain = chainId === monadTestnet.id;
    const chainName = isCorrectChain ? "Monad" : `Chain ${chainId}`;
    
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded-xl text-white shadow border text-xs ${
        isCorrectChain ? 'bg-gray-900 border-gray-800' : 'bg-orange-700 border-orange-600'
      }`}>
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
        <span className="text-xs opacity-75">
          ({chainName})
        </span>
        {!isCorrectChain && (
          <button
            onClick={() => switchChain?.({ chainId: monadTestnet.id })}
            className="ml-1 px-2 py-0.5 rounded text-xs bg-white bg-opacity-20 hover:bg-opacity-30"
            title="Switch to Monad Testnet"
          >
            Switch
          </button>
        )}
        <button
          onClick={handleDisconnect}
          className="ml-2 p-1 rounded hover:bg-gray-800 transition-colors"
          title="Disconnect"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
            />
          </svg>
        </button>
        {copied && <span className="ml-2 text-xs text-green-400">Copied!</span>}
      </div>
    );
  }

  // Connection in progress state
  if (isConnecting || connectStatus === "pending") {
    return (
      <button
        onClick={() => {
          // Allow user to manually reset if stuck
          setIsConnecting(false);
          setConnectionAttempts(0);
        }}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium bg-purple-700 text-white hover:bg-purple-800 justify-center text-xs"
      >
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Connecting... (tap to reset)
      </button>
    );
  }

  // Not connected state - show connect button
  return (
    <button
      onClick={handleConnect}
      role="wallet-connect"
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium bg-purple-700 text-white hover:bg-purple-800 justify-center text-xs"
    >
      Connect Wallet
    </button>
  );
}
