"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ThemeContext } from "./context/ThemeContext";
import { toast } from "react-hot-toast";
import { BigNumber } from "ethers";
import { ethers } from "ethers";
import { Hash, WalletClient, TransactionReceipt } from "viem";

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
import sdk from './services/farcaster';

// Import custom hooks

// Monad Testnet Chain ID
const MONAD_CHAIN_ID = 10143;

// Import counter ABI
import counterABI from "./contract/ABI";
import { useWriteContract, useChainId, useWalletClient, useAccount } from "wagmi";
import { switchChain } from 'viem/actions';
import { parseEther } from 'viem/utils';

// Main component - sadece Warpcast ortamında çalışır
export default function OnChainCounter() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize Farcaster SDK
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // Tell Farcaster that app is ready to be displayed (hide splash screen)
        await sdk.actions.ready();
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initFarcaster();
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
  const { address } = useAccount();
  
  // State for wallet and counter
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [displayedCounter, setDisplayedCounter] = useState("0");
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [fee, setFee] = useState<BigNumber | null>(null);
  
  // Get contract address
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
  }, []);
  
  // wagmi write hook
  const mutation = useWriteContract();
  const isPending = mutation.isPending;
  const isSuccess = mutation.isSuccess;
  
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  
  // Direct leaderboard fetch with proper error handling
  const [directLeaderboard, setDirectLeaderboard] = useState([]);
  const [directLeaderboardLoading, setDirectLeaderboardLoading] = useState(true);

  // Fetch leaderboard directly
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
        // Try with known valid value if size error
        try {
          const users = await contract.getTopUsers(1);
          const formatted = users.map((entry: { user: string; score: { toString(): string }; lastUpdate: { toString(): string } }) => ({
            userAddress: entry.user,
            contributions: parseInt(entry.score.toString()),
            lastUpdate: parseInt(entry.lastUpdate.toString())
          }));
          setDirectLeaderboard(formatted);
        } catch (finalErr) {
          console.error("Final error getting users:", finalErr);
          setDirectLeaderboard([]);
        }
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
  
  // Read contract data
  const fetchContractData = async () => {
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
  };
  
  // Fetch contract data periodically
  useEffect(() => {
    fetchContractData();
    
    const interval = setInterval(fetchContractData, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress]);
  
  // Separate function to check transaction status without blocking UI
  const checkTransactionStatus = async (txHash: Hash, walletClient: WalletClient) => {
    try {
      const { waitForTransactionReceipt } = await import('viem/actions');
      
      // Set a reasonable timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Transaction confirmation timeout")), 25000)
      );
      
      // Race between transaction receipt and timeout
      const receipt = await Promise.race([
        waitForTransactionReceipt(walletClient, { hash: txHash }),
        timeoutPromise
      ]) as TransactionReceipt;
      
      toast.dismiss("increment-transaction");
      
      if (receipt && receipt.status === "success") {
        toast.success("Transaction confirmed!", { id: "increment-success", duration: 3000 });
        fetchContractData(); // Update counter data
      } else {
        toast.error("Transaction failed!", { id: "increment-error", duration: 3000 });
      }
    } catch (err) {
      toast.dismiss("increment-transaction");
      // If it's a timeout, show a different message
      if (err instanceof Error && err.message === "Transaction confirmation timeout") {
        toast.success("Transaction submitted! It may take a while to confirm.", {
          id: "increment-status", 
          duration: 4000
        });
        // Still try to refresh data after a delay
        setTimeout(fetchContractData, 5000);
      } else {
        toast.error("Error checking transaction", { id: "increment-error", duration: 3000 });
      }
    }
  };

  // Success & error feedback - SUSTUR
  React.useEffect(() => {
    if (isSuccess) {
      toast.dismiss("increment-transaction");
      toast.success("Transaction confirmed!", {
        id: "increment-success",
        style: {
          background: "#1e293b",
          color: "#22c55e",
          border: "1px solid rgba(34,197,94,0.2)",
        },
        duration: 3000
      });
      // Counter'ı hemen güncelle
      fetchContractData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);  // txError kaldırıldı
  
  // Modify the transaction submission part in handleIncrement
  const handleIncrement = async () => {
    if (!contractAddress) return;
    
    try {
      // Always try to switch network silently first, without showing error
      if (walletClient && chainId !== MONAD_CHAIN_ID) {
        try {
          await switchChain(walletClient, { id: MONAD_CHAIN_ID });
          
          // Geçiş sonrası kısa bir gecikme ekle
          await new Promise(r => setTimeout(r, 1000));
        } catch {
          // Sessizce başarısız ol - kullanıcıya hatayı gösterme
        }
      }
      
      // Sabit fee kullan
      const feeValue = parseEther('0.005'); // 0.005 MON
      
      try {
        const txHash = await mutation.writeContractAsync({
          address: contractAddress,
          abi: counterABI,
          functionName: "incrementCounter",
          chainId: MONAD_CHAIN_ID,
          value: feeValue,
        });
        
        // Başarılı transaction durumu
        toast.success("Transaction sent!", { id: "increment-success", duration: 3000 });
        
        // Background monitoring
        if (walletClient) {
          checkTransactionStatus(txHash, walletClient);
        }
        
        // Veriyi yenile
        setTimeout(fetchContractData, 3000);
      } catch (txError) {
        // Sadece user rejection'ı göster, başka hiçbir hata gösterme
        if (txError instanceof Error && txError.message.includes('User rejected the request')) {
          toast.error('Transaction cancelled', { id: 'increment-error', duration: 3000 });
        }
        // Diğer tüm hataları gösterme!
      }
    } catch {
      // Hiçbir bağlantı hatasını gösterme
    }
  };
  
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
        <div className="w-full p-3">
          <div className="flex items-center justify-between w-full max-w-xl mx-auto">
            <h1
              className={`text-xl sm:text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              <span className="bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
                Monad Counter
              </span>
            </h1>

              <div className="flex flex-col">
              <WalletButton />
              </div>
          </div>
        </div>

        {/* Main Content - Counter */}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-3 max-w-lg mx-auto">
          {/* Counter Display */}
          <div
            className={`relative overflow-hidden cursor-pointer py-8 px-4 rounded-2xl z-[1] w-full transition-transform hover:scale-102 active:scale-98 ${
              isPending ? "pointer-events-none opacity-50" : ""
            }`}
            onClick={async () => {
              if (isPending) {
                toast.loading("Transaction in progress...", {
                  id: "increment-status",
                  style: {
                    background: "#1e293b",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.1)",
                  },
                });
                return;
              }

              try {
                await handleIncrement();
              } catch {
                // Toast already handled in handleIncrement
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
                <div className="text-center text-xs text-gray-400 mt-2 select-none">Tap to increase</div>
               
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
