"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ThemeContext } from "./context/ThemeContext";
import { toast } from "react-hot-toast";
import { BigNumber } from "ethers";
import { ethers } from "ethers";

// Components
import LeaderboardModal from "./components/LeaderboardModal";
import AccountModal from "./common/AccountModal";
import HowItWorksModal from "./components/HowItWorksModal";
import { FarcasterWrapper } from "./components/FarcasterWrapper";
import WalletButton from "./components/WalletButton";
import { FarcasterShareFooter } from "./components/FarcasterActions";

// Utils
import { getContractAddress } from "./utils/ContractAddresses";

// Farcaster Mini App SDK 
import { useCounter } from "./hooks/useCounter";
import { sdk } from "@farcaster/miniapp-sdk";

// Monad Testnet Chain ID
const MONAD_CHAIN_ID = 10143;

// Import counter ABI
import counterABI from "./contract/ABI";
import { useWriteContract, useChainId, useWalletClient, useAccount, useConnect, useSwitchChain } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { parseEther } from 'viem/utils';

// Main component - only works in Warpcast environment
export default function OnChainCounter() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize loading state and SDK
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if we're in Farcaster environment
        const isInFarcaster = typeof window !== 'undefined' && window.parent !== window;
        
        if (isInFarcaster) {
          console.log("Initializing Farcaster Mini App...");
          
          // Call ready() to hide splash screen - THIS IS CRITICAL FOR MOBILE
          try {
            await sdk.actions.ready();
            console.log("SDK ready() called successfully - splash screen should be hidden");
          } catch (readyError) {
            console.error("Failed to call ready():", readyError);
          }
        }
        
        // Set loading to false after a brief delay
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 500);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("App initialization error:", error);
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  // Loading skeleton component for Farcaster loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-6 animate-pulse">
          {/* Header skeleton */}
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
          
          {/* Counter display skeleton */}
          <div className="relative py-8 px-4 rounded-2xl">
            <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-600/10 blur-xl"></div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex justify-center space-x-4 mt-8">
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the Warpcast counter component
  return <WarpcastCounter />;
}

// Component for Warpcast environment
function WarpcastCounter() {
  const { theme } = React.useContext(ThemeContext);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  
  // Use counter hook for user stats and leaderboard data
  const {
    userStats,
    userRank,
    contributionTarget,
    rankDetails,

  } = useCounter({
    chainId: MONAD_CHAIN_ID,
    address,
    isConnected
  });
  
  // State for wallet and counter
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [displayedCounter, setDisplayedCounter] = useState("0");
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [fee, setFee] = useState<BigNumber | null>(null);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userInteractions, setUserInteractions] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Get contract address - memoized to prevent unnecessary recalculations
  const contractAddress = React.useMemo(() => {
    try {
      return getContractAddress("Counter", MONAD_CHAIN_ID);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Contract address not found", {
        style: {
          background: "#1e293b",
          color: "#ef4444",
          border: "1px solid rgba(239,68,68,0.2)",
        },
      });
      return null;
    }
  }, []); // Empty dependency array since MONAD_CHAIN_ID is constant
  
  // wagmi hooks
  const mutation = useWriteContract();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain: switchChainAsync } = useSwitchChain();
  
  // Debug chain information
  useEffect(() => {
    console.log("Current chain ID:", chainId);
    console.log("Target chain ID:", MONAD_CHAIN_ID);
    console.log("Wallet client available:", !!walletClient);
    console.log("Contract address:", contractAddress);
  }, [chainId, walletClient, contractAddress]);
  
  // Function to determine if in Warpcast environment
  const isInWarpcast = useCallback(() => {
    return typeof window !== 'undefined' && window.parent !== window;
  }, []);
  
  // Auto-connect wallet function with improved state management
  const autoConnectWallet = useCallback(async () => {
    if (isConnected || isConnecting) return;
    
    try {
      setIsConnecting(true);
      toast.loading("Connecting wallet...", { id: "wallet-connect" });
      
      if (isInWarpcast()) {
        // In Warpcast, always use farcaster connector
        await connect({ connector: farcasterFrame() });
      } else {
        // In browser, try MetaMask connector
        await connect({ connector: metaMask() });
      }
      
      toast.dismiss("wallet-connect");
      toast.success("Wallet connected!");
    } catch (error) {
      console.error("Connection error:", error);
      toast.dismiss("wallet-connect");
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isInWarpcast, connect]); // Removed isConnecting to prevent loops

  // Add wallet state synchronization
  const [walletStateVersion, setWalletStateVersion] = useState(0);

  // Force wallet state refresh when switching wallets
  const refreshWalletState = useCallback(() => {
    setWalletStateVersion(prev => prev + 1);
    // Force a small delay to ensure wallet state is updated
    setTimeout(() => {
      // This will trigger re-renders and re-evaluation of wallet state
    }, 100);
  }, []);
  
  // Direct leaderboard fetch with proper error handling
  const [directLeaderboard, setDirectLeaderboard] = useState([]);
  const [directLeaderboardLoading, setDirectLeaderboardLoading] = useState(true);

  // Fetch leaderboard directly - memoized to prevent unnecessary re-renders
  const fetchLeaderboardDirect = useCallback(async () => {
    if (!contractAddress) return;
    setDirectLeaderboardLoading(true);
    
    try {
      // Create a minimal ethers provider
      const provider = new ethers.providers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
      const contract = new ethers.Contract(contractAddress, counterABI, provider);
      
      // Get leaderboard size
      const leaderboardSize = await contract.leaderboardSize();
      
      // If size is 0, return empty array
      if (leaderboardSize.eq(0)) {
        setDirectLeaderboard([]);
        setDirectLeaderboardLoading(false);
        return;
      }
      
      // Get all users
      try {
        // Note: using toString() to handle BigNumber conversion
        const sizeNumber = parseInt(leaderboardSize.toString());
        
        const users = await contract.getTopUsers(sizeNumber);
        
        // Format for component
        const formatted = users.map((entry: { user: string; score: { toString(): string }; lastUpdate: { toString(): string } }) => ({
          userAddress: entry.user,
          contributions: parseInt(entry.score.toString()),
          lastUpdate: parseInt(entry.lastUpdate.toString())
        }));
        
        setDirectLeaderboard(formatted);
      } catch (err) {
        console.error("Error getting top users:", err);
        setDirectLeaderboard([]);
      }
    } catch (err) {
      console.error("Direct leaderboard fetch error:", err);
      setDirectLeaderboard([]);
    } finally {
      setDirectLeaderboardLoading(false);
    }
  }, [contractAddress]);
  
  // Fetch direct leaderboard on load
  useEffect(() => {
    fetchLeaderboardDirect();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboardDirect, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboardDirect]);
  
  // Fetch contract data - memoized to prevent unnecessary re-renders
  const fetchContractData = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      // Simple JSON-RPC calls for contract reads
      const response = await fetch("https://testnet-rpc.monad.xyz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            {
              to: contractAddress,
              data: "0xddca3f43" // fee() function signature
            },
            "latest"
          ]
        })
      });
      
      const data = await response.json();
      if (data.result) {
        setFee(BigNumber.from(data.result));
      }
      
      // Get counter value
      const counterResponse = await fetch("https://testnet-rpc.monad.xyz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "eth_call",
          params: [
            {
              to: contractAddress,
              data: "0x61bc221a" // counter() function signature
            },
            "latest"
          ]
        })
      });
      
      const counterData = await counterResponse.json();
      if (counterData.result) {
        setDisplayedCounter(BigNumber.from(counterData.result).toString());
      }
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
    }
  }, [contractAddress]);
  
  // Fetch contract data periodically
  useEffect(() => {
    fetchContractData();
    
    const interval = setInterval(fetchContractData, 15000);
    return () => clearInterval(interval);
  }, []); // Removed fetchContractData from dependencies to prevent loops

  // Auto switch to Monad Testnet when connected but on wrong chain
  useEffect(() => {
    const autoSwitchChain = async () => {
      // Only auto-switch in non-Farcaster environments
      const isInFarcaster = typeof window !== 'undefined' && window.parent !== window;
      if (isConnected && chainId !== MONAD_CHAIN_ID && switchChainAsync && !isInFarcaster) {
        try {
          console.log(`Auto-switching from chain ${chainId} to Monad Testnet (${MONAD_CHAIN_ID})`);
          await switchChainAsync({ chainId: MONAD_CHAIN_ID });
          console.log("Auto-switched to Monad Testnet successfully");
        } catch (error) {
          console.log("Auto chain switch failed (user might have rejected):", error);
          // Don't show error toast for automatic switching, just log it
        }
      }
    };

    // Add a small delay to ensure wallet is fully connected
    const timer = setTimeout(() => {
      autoSwitchChain();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isConnected, chainId, switchChainAsync]);
  
  // Enhanced handleIncrement with wallet state validation
  const handleIncrement = useCallback(async () => {
    if (!contractAddress || isTransactionPending) {
      if (isTransactionPending) {
        toast.error("Transaction in progress, please wait", {
          id: "tx-already-pending",
          duration: 3000
        });
      }
      return;
    }
    
    try {
      // Validate wallet state before proceeding
      if (!isConnected || !address) {
        console.log("Wallet not properly connected, attempting to reconnect...");
        await autoConnectWallet();
        // Wait a bit for wallet state to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check again after reconnection attempt
        if (!isConnected || !address) {
          toast.error("Please connect your wallet first", { duration: 3000 });
          return;
        }
      }
      
      // Set transaction as pending
      setIsTransactionPending(true);
      
      // Show loading toast
      toast.loading("Preparing transaction...", {
        id: "tx-loading",
        duration: 10000
      });
      
      // For Farcaster environment, ensure wallet is properly authorized
      const isInFarcaster = typeof window !== 'undefined' && window.parent !== window;
      if (isInFarcaster) {
        // In Farcaster, we need to ensure the wallet is properly connected
        // and the user has authorized the transaction
        console.log("Farcaster environment detected, ensuring wallet authorization...");
        
        // Wait a bit for wallet state to be fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if wallet is still connected
        if (!isConnected || !address) {
          toast.dismiss("tx-loading");
          setIsTransactionPending(false);
          toast.error("Wallet connection lost. Please reconnect.", { duration: 3000 });
          return;
        }
      }
      
      // Switch network if needed - but only for non-Farcaster environments
      if (chainId !== MONAD_CHAIN_ID && !isInFarcaster) {
        try {
          console.log(`Auto-switching from chain ${chainId} to ${MONAD_CHAIN_ID}`);
          
          // Show specific message for chain switching
          toast.loading("Switching to Monad Testnet...", {
            id: "chain-switch",
            duration: 8000
          });
          
          // Use wagmi's switchChain which handles wallet prompts automatically
          await switchChainAsync({ chainId: MONAD_CHAIN_ID });
          
          // Brief wait for chain switch to complete
          await new Promise(r => setTimeout(r, 1500));
          
          console.log("Successfully switched to Monad Testnet");
          toast.dismiss("chain-switch");
          toast.success("Switched to Monad Testnet!", { duration: 2000 });
          
        } catch (error) {
          console.error("Network switch error:", error);
          setIsTransactionPending(false);
          toast.dismiss("chain-switch");
          toast.dismiss("tx-loading");
          
          if (error instanceof Error && error.message.includes("User rejected")) {
            toast.error("Network switch cancelled", { duration: 3000 });
          } else if (error instanceof Error && error.message.includes("Unsupported chain")) {
            toast.error("Please add Monad Testnet to your wallet", { duration: 5000 });
          } else {
            toast.error("Please switch to Monad Testnet manually", { duration: 5000 });
          }
          return;
        }
      }
      
      // Use fixed fee
      const feeValue = parseEther('0.005'); // 0.005 MON
      
      // Handle Farcaster vs regular wallet transactions differently
      if (isInFarcaster) {
        // For Farcaster, use a custom approach that bypasses wagmi's chainId validation
        console.log("Farcaster environment detected, using custom transaction approach");
        
        try {
          // For Farcaster, try the simplest approach first - without chainId
          console.log("Attempting Farcaster transaction without chainId specification");
          await mutation.writeContractAsync({
            address: contractAddress,
            abi: counterABI,
            functionName: "incrementCounter",
            value: feeValue,
            account: address,
            // Intentionally omit chainId to avoid getChainId issues
          });
          
          console.log("Farcaster transaction sent successfully");
          
        } catch (error) {
          console.error("Farcaster transaction error:", error);
          
          // If the first approach fails, try without account specification
          if (error instanceof Error && (error.message.includes("getChainId") || error.message.includes("connector"))) {
            console.log("Detected connector issue, trying alternative approach");
            
            try {
              await mutation.writeContractAsync({
                address: contractAddress,
                abi: counterABI,
                functionName: "incrementCounter",
                value: feeValue,
                // Remove both chainId and account specification
              });
            } catch (fallbackError) {
              console.error("Fallback transaction also failed:", fallbackError);
              throw fallbackError;
            }
          } else {
            throw error;
          }
        }
        
      } else {
        // For regular wallets, use normal transaction with full configuration
        console.log("Regular wallet environment, using standard transaction");
        
        await mutation.writeContractAsync({
          address: contractAddress,
          abi: counterABI,
          functionName: "incrementCounter",
          chainId: MONAD_CHAIN_ID,
          value: feeValue,
          account: address,
        });
      }
      
      // Dismiss loading toast
      toast.dismiss("tx-loading");
      
      // Success message (without waiting for confirmation)
      toast.success("Transaction sent!", { 
        id: "tx-success",
        duration: 3000 
      });
      
      // Immediately release UI to enable new transactions
      setIsTransactionPending(false);
      
      // Increment user interactions
      setUserInteractions(prev => prev + 1);
      
      // Refresh data to update the counter
      fetchContractData();
      
    } catch (error) {
      console.error("Transaction error:", error);
      setIsTransactionPending(false);
      toast.dismiss("tx-loading");
      
      // Enhanced error handling for wallet switching issues
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          toast.error("Transaction cancelled by user", { duration: 3000 });
        } else if (error.message.includes("chain")) {
          toast.error("Please switch to Monad Testnet in your wallet", { duration: 5000 });
        } else if (error.message.includes("unauthorized") || error.message.includes("not been authorized")) {
          // Handle Farcaster wallet authorization issue
          toast.error("Wallet authorization required. Please reconnect your wallet.", { duration: 5000 });
          // Force wallet state refresh
          refreshWalletState();
        } else if (error.message.includes("getChainId") || error.message.includes("connector")) {
          // Handle Farcaster connector specific error
          toast.error("Wallet connection issue. Please refresh and try again.", { duration: 5000 });
          refreshWalletState();
        } else {
          toast.error("Transaction failed", { duration: 3000 });
        }
      } else {
        toast.error("Transaction failed", { duration: 3000 });
      }
    }
  }, [contractAddress, isTransactionPending, chainId, mutation, fetchContractData, switchChainAsync, isConnected, address, autoConnectWallet, refreshWalletState]);

  // Add wallet state monitoring
  useEffect(() => {
    // Monitor wallet state changes and refresh if needed
    if (isConnected && address) {
      console.log("Wallet connected:", address);
      console.log("Current chain ID:", chainId);
    }
  }, [isConnected, address, chainId, walletStateVersion]);
  
  return (
    <FarcasterWrapper>
      <div
        className={`min-h-screen flex flex-col items-center ${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        }`}
        style={{
          backgroundColor: theme === "dark" ? "#000" : "#fff",
        }}
      >
        {/* Top Section - Header */}
        <div className="w-full p-6">
          <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
              Monad Counter
            </h1>
            <WalletButton />
          </div>
        </div>

        {/* Main Content - Counter */}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-3 max-w-lg mx-auto">
          {/* Counter Display */}
          <div
            className={`relative overflow-hidden cursor-pointer py-8 px-4 rounded-2xl z-[1] w-full transition-transform hover:scale-102 active:scale-98 ${
              isTransactionPending ? "pointer-events-none opacity-50" : ""
            }`}
            onClick={async () => {
              // If a transaction is pending, block interaction
              if (isTransactionPending) {
                return;
              }

              try {
                // Check if wallet is connected
                if (!isConnected) {
                  // Auto-connect the wallet first
                  await autoConnectWallet();
                  
                  // Return for now, user can tap again after connecting
                  return;
                }
                
                // Validate wallet state before proceeding
                if (!address) {
                  console.log("Address not available, refreshing wallet state...");
                  refreshWalletState();
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Wallet is connected, proceed with transaction
                await handleIncrement();
              } catch (error) {
                console.error("Increment error:", error);
              }
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-50 z-[-1]" />

            <div className="relative text-center">
              {/* Counter Value */}
              <div className="py-4">
                <div 
                  className={`relative font-mono font-bold mb-4
                    ${displayedCounter.length > 6 ? "text-[32px] sm:text-[44px] md:text-[64px]" : "text-[56px] sm:text-[72px] md:text-[96px]"}
                    transition-all duration-200 drop-shadow-sm
                  `}
                >
                  <span className="relative inline-block px-2 py-1">
                    <span className="relative z-10 bg-gradient-to-br from-violet-400 to-purple-600 bg-clip-text text-transparent">
                      {displayedCounter.replace(/\B(?=(\d{3})+(?!\d))/g, " ") || "0"}
                    </span>
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-600/10 blur-xl"></span>
                    <span className={`absolute inset-0 rounded-xl ${theme === "dark" ? "bg-black/40" : "bg-white/40"} backdrop-blur-sm -z-10`}></span>
                  </span>
                </div>
                <div className="text-center text-xs text-gray-400 mt-2 select-none">
                  {isTransactionPending ? "Transaction in progress..." : isConnected ? "Tap to increase" : "Tap to connect and increase"}
                </div>
               
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Footer with links */}
        <div className="w-full p-4 mt-auto">
          <div className="flex items-center justify-center gap-4 text-sm">
            <button 
              onClick={() => setIsStatsModalOpen(true)}
              className={`text-sm ${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"} transition-colors`}
            >
              Leaderboard
            </button>
            <button 
              onClick={() => setIsHowItWorksOpen(true)}
              className={`text-sm ${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"} transition-colors`}
            >
              How it works
            </button>
          </div>
        </div>

        {/* User Stats */}
        
        {/* Farcaster Share Footer */}
        <FarcasterShareFooter counterValue={displayedCounter} />
        
        
        {/* Modals */}
        {isStatsModalOpen && (
          <LeaderboardModal 
            onClose={() => setIsStatsModalOpen(false)}
            leaderboard={directLeaderboard}
            loading={directLeaderboardLoading}
            theme={theme}
            address={address}
            userStats={userStats}
            userRank={userRank}
            rankDetails={rankDetails}
            contributionTarget={contributionTarget}
          />
        )}
        {isAccountModalOpen && (
          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            theme={theme}
          />
        )}
        {isHowItWorksOpen && (
          <HowItWorksModal
            onClose={() => setIsHowItWorksOpen(false)}
            theme={theme}
            fee={fee}
          />
        )}
      </div>
    </FarcasterWrapper>
  );
}
