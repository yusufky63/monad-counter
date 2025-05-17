"use client";

import React from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { useMiniAppContext } from "../hooks/useMiniAppContext";
import { useSwitchChain } from "wagmi";

export default function WalletButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, status: connectStatus, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [copied, setCopied] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  
  // Import context for Farcaster functionality - not directly used but kept for future
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isEthProviderAvailable, isSDKLoaded, actions } = useMiniAppContext();

  // Determine if we're in Warpcast environment
  function isInWarpcast() {
    return typeof window !== 'undefined' && window.parent !== window;
  }

  // Log connector information to debug connection issues
  React.useEffect(() => {
    console.log("Available connectors:", connectors.map(c => ({
      id: c.id,
      name: c.name,
      ready: c.ready,
    })));
  }, [connectors]);

  // Log connection status to help debug
  React.useEffect(() => {
    console.log("Connection state:", {
      isConnected,
      connectStatus,
      isConnecting,
      hasError: !!connectError
    });
    
    if (connectError) {
      console.error("Connection error:", connectError);
    }
  }, [isConnected, connectStatus, isConnecting, connectError]);

  // Auto-connect only once on mount
  React.useEffect(() => {
    const autoConnect = async () => {
      try {
        if (isInWarpcast()) {
          // In Warpcast, use farcaster connector (id is 'farcaster', not 'farcasterFrame')
          const farcasterConnector = connectors.find(c => c.id === 'farcaster');
          if (farcasterConnector) {
            setIsConnecting(true);
            await connect({ connector: farcasterConnector });
          } else {
            console.error("Farcaster connector not found");
          }
        } else {
          // In browser, try to auto-connect with any available wallet
          // Don't depend on the 'ready' status, just try to connect
          if (connectors.length > 0) {
            // Try with different connectors without checking ready status
            const priorityConnectors = [
              connectors.find(c => c.id === 'injected'),
              connectors.find(c => c.id === 'metaMaskSDK'),
              ...connectors.filter(c => c.id !== 'farcaster') // Try all non-farcaster connectors
            ].filter(Boolean); // Remove undefined values
            
            for (const connector of priorityConnectors) {
              try {
                if (connector) {
                  setIsConnecting(true);
                  console.log(`Trying to connect with ${connector.id}`);
                  await connect({ connector });
                  break; // Exit loop if successful
                }
              } catch (err) {
                console.log(`Failed to connect with ${connector?.id}:`, err);
                // Continue to next connector
              }
            }
          }
        }
      } catch (error) {
        console.error("Auto-connect failed:", error);
      } finally {
        setIsConnecting(false);
      }
    };

    if (!isConnected && !isConnecting) {
      autoConnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if we're on the right chain when wallet is connected
  React.useEffect(() => {
    if (isConnected && chainId !== monadTestnet.id) {
      try {
        switchChain({ chainId: monadTestnet.id });
      } catch (error: unknown) {
        console.log("Chain switch failed:", error);
      }
    }
  }, [isConnected, chainId, switchChain]);

  // Handle manual connection
  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      if (isInWarpcast()) {
        // Find Farcaster connector using correct ID
        const farcasterConnector = connectors.find(c => c.id === 'farcaster');
        if (farcasterConnector) {
          console.log("Connecting with Farcaster");
          await connect({ connector: farcasterConnector });
        } else {
          console.error("Farcaster connector not found");
        }
      } else {
        // In browser, try all connectors in sequence
        // Don't rely on 'ready' status - just try connecting
        if (connectors.length > 0) {
          let success = false;
          
          // First try injected
          const injectedConnector = connectors.find(c => c.id === 'injected');
          if (injectedConnector) {
            try {
              console.log("Trying injected connector");
              await connect({ connector: injectedConnector });
              success = true;
            } catch (err) {
              console.log("Injected connector failed:", err);
            }
          }
          
          // Then try MetaMask
          if (!success) {
            const metaMaskConnector = connectors.find(c => c.id === 'metaMaskSDK');
            if (metaMaskConnector) {
              try {
                console.log("Trying MetaMask connector");
                await connect({ connector: metaMaskConnector });
                success = true;
              } catch (err) {
                console.log("MetaMask connector failed:", err);
              }
            }
          }
          
          // Finally try any other browser connectors
          if (!success) {
            const browserConnectors = connectors.filter(c => 
              c.id !== 'farcaster' && c.id !== 'injected' && c.id !== 'metaMaskSDK'
            );
            
            for (const connector of browserConnectors) {
              try {
                console.log(`Trying ${connector.name} connector`);
                await connect({ connector });
                success = true;
                break;
              } catch (err) {
                console.log(`${connector.name} connector failed:`, err);
              }
            }
          }
          
          if (!success) {
            console.error("All connection attempts failed");
            alert("Could not connect to any wallet. Please make sure you have a wallet extension installed and try again.");
          }
        } else {
          console.error("No connectors available");
          alert("No wallet connectors found. Please install MetaMask or another wallet extension.");
        }
      }
    } catch (error) {
      console.error("Connection failed:", error);
      alert("Connection failed. Please make sure you have a wallet extension installed.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle disconnection
  const handleDisconnect = () => {
    disconnect();
  };

  // Connected state - show address and disconnect button
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
          onClick={handleDisconnect}
          className="ml-2 p-1 rounded hover:bg-gray-800 transition-colors"
          title="Disconnect"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
        </button>
        {copied && <span className="ml-2 text-xs text-green-400">Copied!</span>}
      </div>
    );
  }

  // Connection in progress state
  if (isConnecting || connectStatus === 'pending') {
    return (
      <button 
        disabled
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-purple-700/70 text-white justify-center w-full cursor-wait"
      >
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Connecting...
      </button>
    );
  }

  // Not connected state - show connect button
  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-purple-700 text-white hover:bg-purple-800 justify-center w-full"
    >
      Connect Wallet
    </button>
  );
}
