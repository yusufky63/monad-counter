"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { useSwitchChain } from "wagmi";
// useFrame removed - haptics not needed

// Monad Testnet Chain ID - Fixed network
const MONAD_TESTNET_ID = 10143;

export default function WalletButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  // Haptics removed

  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-switch to Monad network after connection
  const autoSwitchToMonad = React.useCallback(async () => {
    if (chainId !== MONAD_TESTNET_ID) {
      try {
        console.log("🔄 Auto-switching to Monad Testnet");
        await switchChain({ chainId: MONAD_TESTNET_ID });
        console.log("✅ Auto-switched to Monad Testnet");
      } catch (error) {
        console.error("Auto-switch to Monad failed:", error);
      }
    }
  }, [chainId, switchChain]);
  
  // Initial network check on component mount
  useEffect(() => {
    if (isConnected && chainId) {
      console.log(`🚀 Initial network check: ${chainId === MONAD_TESTNET_ID ? 'CORRECT' : 'WRONG'} network detected`);
      
      if (chainId !== MONAD_TESTNET_ID) {
        console.log("🔄 Starting immediate network correction on mount...");
        setTimeout(() => autoSwitchToMonad(), 500);
      }
    }
  }, [isConnected, chainId, autoSwitchToMonad]);

  // Wallet connection with Farcaster Mini App support
  const handleConnect = async () => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);

      // Find Farcaster Mini App connector first, fallback to others
      const farcasterConnector = connectors.find(
        (c) =>
          c.name?.toLowerCase().includes("farcaster") ||
          c.id === "farcaster" ||
          c.id === "farcasterMiniApp"
      );

      const injectedConnector = connectors.find((c) => c.id === "injected");
      const connector =
        farcasterConnector || injectedConnector || connectors[0];

        if (connector) {
          console.log(`🔌 Connecting with ${connector.name || connector.id} in Farcaster`);
          await connect({ connector });

          // Enhanced post-connection Monad switch for Farcaster
          console.log("💫 Starting enhanced Monad switch sequence for Farcaster...");
          
          setTimeout(async () => {
            console.log("🔄 Phase 1: Initial auto-switch to Monad");
            await autoSwitchToMonad();
            
            // Double-check and retry if needed
            setTimeout(async () => {
              const currentChain = chainId;
              console.log(`🔍 Phase 2: Verification - Current chain: ${currentChain}, Target: ${MONAD_TESTNET_ID}`);
              
              if (currentChain !== MONAD_TESTNET_ID) {
                console.log("⚠️ Phase 2: Still wrong network, forcing switch...");
                await autoSwitchToMonad();
                
                // Final verification
                setTimeout(() => {
                  const finalChain = chainId;
                  console.log(`🏁 Final check: ${finalChain === MONAD_TESTNET_ID ? '✅ SUCCESS' : '❌ MANUAL REQUIRED'}`);
                }, 1000);
              } else {
                console.log("✅ Phase 2: Successfully on Monad!");
              }
            }, 2000);
          }, 1500);
        }
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnection
  const handleDisconnect = async () => {
    try {
      disconnect();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // Switch to Monad Testnet (forced)
  const handleSwitchChain = async () => {
    try {
      await switchChain({ chainId: MONAD_TESTNET_ID });
    } catch (error) {
      console.error("Chain switch failed:", error);
    }
  };

  // Enhanced auto-switch with Farcaster compatibility
  useEffect(() => {
    if (isConnected && chainId && chainId !== MONAD_TESTNET_ID) {
      console.log(
        `🚨 WRONG NETWORK DETECTED! Current: ${chainId}, Required: ${MONAD_TESTNET_ID}`
      );
      
      // Enhanced switch with Farcaster detection
      const attemptSwitchWithFarcasterSupport = async (attempt = 1, maxAttempts = 5) => {
        console.log(`🔄 Switch attempt ${attempt}/${maxAttempts} for Farcaster environment`);
        
        try {
          // Check if we're in Farcaster Mini App
          const inFarcaster = typeof window !== 'undefined' && 
            (window.parent !== window || 
             document.referrer.includes('farcaster') ||
             window.location.href.includes('farcaster'));
             
          console.log(`📱 Farcaster environment detected: ${inFarcaster}`);
          
          await autoSwitchToMonad();
          
          // Extra verification after switch
          setTimeout(async () => {
            const newChainId = chainId;
            console.log(`✅ Post-switch verification: ${newChainId === MONAD_TESTNET_ID ? 'SUCCESS' : 'FAILED'}`);
            
            if (newChainId !== MONAD_TESTNET_ID && attempt < maxAttempts) {
              console.log(`🔄 Chain still wrong, retrying in ${attempt * 2000}ms...`);
              setTimeout(
                () => attemptSwitchWithFarcasterSupport(attempt + 1, maxAttempts),
                attempt * 2000 // Longer delays for Farcaster
              );
            }
          }, 1500);
          
        } catch (error) {
          console.error(`❌ Switch attempt ${attempt} failed:`, error);
          
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying in ${attempt * 2000}ms... (Farcaster may need longer delays)`);
            setTimeout(
              () => attemptSwitchWithFarcasterSupport(attempt + 1, maxAttempts),
              attempt * 2000
            );
          } else {
            console.error("🚨 ALL AUTO-SWITCH ATTEMPTS FAILED! User must switch manually.");
          }
        }
      };

      // Start enhanced switch process
      attemptSwitchWithFarcasterSupport();
    } else if (isConnected && chainId === MONAD_TESTNET_ID) {
      console.log("✅ CORRECT NETWORK: Already on Monad Testnet");
    }
  }, [isConnected, chainId, autoSwitchToMonad]);

  // Loading state
  useEffect(() => {
    if (connectStatus === "pending") {
      setIsConnecting(true);
    } else {
      setIsConnecting(false);
    }
  }, [connectStatus]);

  // Connected state - Monad only
  if (isConnected && address) {
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-3)}`;
    const isOnMonad = chainId === MONAD_TESTNET_ID;

    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white shadow-sm transition-all ${
          isOnMonad
            ? "bg-purple-600 hover:bg-purple-700"
            : "bg-orange-600 hover:bg-orange-700 animate-pulse"
        }`}
      >
        <span
          className="font-mono text-sm cursor-pointer hover:underline"
          onClick={handleCopyAddress}
          title={`${address} (click to copy)`}
        >
          {shortAddress}
        </span>

        {/* Network indicator */}

        {!isOnMonad && (
          <button
            onClick={handleSwitchChain}
            className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
            title="Switch to Monad Testnet"
          >
            Switch
          </button>
        )}

        <button
          onClick={handleDisconnect}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title="Disconnect wallet"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
            />
          </svg>
        </button>

        {copied && (
          <span className="text-xs text-green-200 animate-fade-in">
            Copied!
          </span>
        )}
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg opacity-75 cursor-not-allowed"
      >
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Connecting...
      </button>
    );
  }

  // Not connected state
  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
    >
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
      Connect Wallet
    </button>
  );
}
