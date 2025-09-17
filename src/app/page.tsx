"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ThemeContext } from "./context/ThemeContext";
import { toast } from "react-hot-toast";
import { useAccount, useConnect, useWriteContract, useChainId, useSwitchChain } from "wagmi";
import { parseEther } from 'viem/utils';

// Components - dokümana göre
import { useFrame } from "./providers/FrameProvider";
import LeaderboardModal from "./components/LeaderboardModal";
import HowItWorksModal from "./components/HowItWorksModal";
import WalletButton from "./components/WalletButton";

// Utils and contract
import { getContractAddress } from "./utils/ContractAddresses";
import counterABI from "./contract/ABI";
import { useCounter } from "./hooks/useCounter";

// Monad Testnet Chain ID
const MONAD_CHAIN_ID = 10143;

// Contract leaderboard data interface
interface ContractLeaderboardItem {
  userAddress: string;
  contributions: number;
  lastUpdate: number;
}

// Leaderboard UI data interface
interface LeaderboardUIItem {
  address: string;
  userAddress: string;
  contributions: number;
  contribution: number;
  rank: number;
  username: string;
  isCurrentUser: boolean;
}

export default function MonadCounterApp() {
  const { isSDKLoaded, isInMiniApp } = useFrame();
  const [isAppReady, setIsAppReady] = useState(false);

  // SDK yüklendikten sonra uygulama içeriğini hazırla
  useEffect(() => {
    if (isSDKLoaded) {
      // İlk önce uygulama içeriğini göster, ready() çağrısını CounterApp'e bırak
      setIsAppReady(true);
    }
  }, [isSDKLoaded]);

  // Loading state - dokümana göre
  if (!isAppReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
        <div className="w-full max-w-md p-6 animate-pulse">
          {/* Header skeleton */}
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
          
          {/* Counter display skeleton */}
          <div className="relative py-8 px-4 rounded-2xl">
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex justify-center space-x-4 mt-8">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
        <div className="text-center mt-4 text-gray-600 dark:text-gray-400 text-sm">
          {isInMiniApp ? "Initializing Mini App..." : "Loading Monad Counter..."}
        </div>
      </div>
    );
  }
  
  // Render main app
  return <CounterApp />;
}

// Ana Counter bileşeni
function CounterApp() {
  const { theme } = React.useContext(ThemeContext);
  const { isInMiniApp, context, haptics, composeCast, callReady } = useFrame();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { 
    writeContract, 
    data: hash, 
    error: writeError
  } = useWriteContract();

  // Counter hook
  const {
    userStats,
    userRank,
    contributionTarget,
    rankDetails,
    leaderboard: hookLeaderboard,
    refreshData
  } = useCounter({
    chainId: MONAD_CHAIN_ID,
    address,
    isConnected
  });
  
  // State
  const [counter, setCounter] = useState("0");
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUIItem[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  
  // Transaction timeout ref
  const transactionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Processed hash ref - loop'u önlemek için
  const processedHashRef = React.useRef<string | null>(null);

  // Contract address
  const contractAddress = React.useMemo(() => {
    try {
      return getContractAddress("Counter", MONAD_CHAIN_ID);
    } catch {
      toast.error("Contract address not found");
      return null;
    }
  }, []);
  
  // Wallet connection - dokümana göre - SADECE MONAD AĞI
  const handleWalletConnect = async () => {
    try {
      // Haptic feedback
      try {
        await haptics.selection();
      } catch (error) {
        console.log("Haptic selection failed:", error);
      }
      
      if (isConnected) {
        // Zaten bağlı ama ağı kontrol et
        if (chainId !== MONAD_CHAIN_ID) {
          await handleNetworkSwitch();
        }
        return;
      }
      
      // Farcaster Mini App connector'ını kullan
      const farcasterConnector = connectors.find(connector => 
        connector.name === 'farcasterMiniApp' || connector.id === 'farcaster'
      );
      
      if (farcasterConnector) {
        await connect({ connector: farcasterConnector });
      } else {
        // Fallback
        await connect({ connector: connectors[0] });
      }
      
      try {
        await haptics.notification('success');
      } catch (error) {
        console.log("Haptic notification failed:", error);
      }
      toast.success("Wallet connected!");
      
      // Bağlandıktan sonra hemen Monad ağına switch et
      setTimeout(() => {
        if (chainId !== MONAD_CHAIN_ID) {
          handleNetworkSwitch();
        }
      }, 1000);
      
    } catch (error) {
      console.error("Wallet connection failed:", error);
      try {
        await haptics.notification('error');
      } catch (hapticError) {
        console.log("Haptic error failed:", hapticError);
      }
      toast.error("Failed to connect wallet");
    }
  };

  // Network switch - SADECE MONAD'A İZİN VER
  const handleNetworkSwitch = async () => {
    try {
      toast.loading("Switching to Monad Testnet...", { id: "network-switch" });
      await switchChain({ chainId: MONAD_CHAIN_ID });
      toast.dismiss("network-switch");
      toast.success("Switched to Monad Testnet!");
      try {
        await haptics.notification('success');
      } catch (error) {
        console.log("Haptic notification failed:", error);
      }
    } catch (error) {
      toast.dismiss("network-switch");
      console.error("Network switch failed:", error);
      toast.error("Please manually switch to Monad Testnet");
      try {
        await haptics.notification('error');
      } catch (hapticError) {
        console.log("Haptic error failed:", hapticError);
      }
    }
  };

  // Counter artırma - dokümana göre
  const handleIncrement = async () => {
    if (!contractAddress || isTransactionPending) return;
    
    try {
      // Haptic feedback
      try {
        await haptics.impact('medium');
      } catch (error) {
        console.log("Haptic impact failed:", error);
      }
      
      // Wallet bağlantısını kontrol et
      if (!isConnected) {
        await handleWalletConnect();
        return;
      }
      
      // Chain kontrolü - SADECE MONAD KABUL ET
      if (chainId !== MONAD_CHAIN_ID) {
        await handleNetworkSwitch();
        return; // Network switch'ten sonra tekrar denesin
      }

      setIsTransactionPending(true);
      toast.loading("Sending transaction...", { id: "tx-loading" });
      
      // Yeni transaction başladı - previous hash'i temizle
      processedHashRef.current = null;

      // Çok kısa timeout - 5 saniye sonra loading'i kapat (cancel durumu için)
      transactionTimeoutRef.current = setTimeout(() => {
        console.warn("Transaction likely cancelled - auto clearing");
        toast.dismiss("tx-loading");
        setIsTransactionPending(false);
      }, 5000); // 5 saniye çok agresif

      try {
        // Transaction gönder
        writeContract({
          address: contractAddress,
          abi: counterABI,
          functionName: "incrementCounter",
          value: parseEther('0.005'), // 0.005 MON fee
        });
      } catch (writeError: unknown) {
        // writeContract'tan gelen immediate hata
        if (transactionTimeoutRef.current) {
          clearTimeout(transactionTimeoutRef.current);
          transactionTimeoutRef.current = null;
        }
        
        console.error("WriteContract immediate error:", writeError);
        
        // Immediate cancel detection
        const errorMessage = (writeError as Error & { message?: string })?.message?.toLowerCase() || '';
        const errorCode = (writeError as Error & { code?: number | string })?.code;
        const isCancelledImmediate = errorMessage.includes("user rejected") || 
                                   errorMessage.includes("cancelled") ||
                                   errorCode === 4001;
        
        toast.dismiss("tx-loading");
        
        if (isCancelledImmediate) {
          console.log("🚫 Transaction cancelled immediately");
          try {
            await haptics.notification('warning');
          } catch (error) {
            console.log("Haptic warning failed:", error);
          }
        } else {
          toast.error("Failed to send transaction", { duration: 3000 });
          try {
            await haptics.notification('error');
          } catch (error) {
            console.log("Haptic error failed:", error);
          }
        }
        setIsTransactionPending(false);
      }
      
    } catch (error: unknown) {
      if (transactionTimeoutRef.current) {
        clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
      console.error("Setup error:", error);
      toast.dismiss("tx-loading");
      toast.error("Transaction setup failed");
      try {
        await haptics.notification('error');
      } catch (hapticError) {
        console.log("Haptic error failed:", hapticError);
      }
      setIsTransactionPending(false);
    }
  };

  // Counter değerini getir
  const fetchCounter = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const response = await fetch("https://testnet-rpc.monad.xyz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
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
      
      const data = await response.json();
      if (data.result) {
        const value = parseInt(data.result, 16).toString();
        setCounter(value);
      }
    } catch (error) {
      console.error("Failed to fetch counter:", error);
    }
  }, [contractAddress]);
  
  // Leaderboard yükle - gerçek contract verilerini kullan
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      // Hook'tan gelen gerçek contract verisini kullan
      if (hookLeaderboard && hookLeaderboard.length > 0) {
        // Contract verisini UI formatına dönüştür
        const formattedLeaderboard = hookLeaderboard.map((item: ContractLeaderboardItem, index: number) => {
          const shortAddress = `${item.userAddress.slice(0, 6)}...${item.userAddress.slice(-4)}`;
          const isCurrentUser = address ? item.userAddress.toLowerCase() === address.toLowerCase() : false;
          
          // Username olarak kısa wallet adresi kullan
          const username = isCurrentUser ? "you" : shortAddress.toLowerCase();
          
          return {
            address: shortAddress,
            userAddress: item.userAddress, // Leaderboard.js için
            contributions: Number(item.contributions), // Leaderboard.js için
            contribution: Number(item.contributions),
            rank: index + 1, // Zaten sıralanmış olarak geliyor
            username: username,
            isCurrentUser: isCurrentUser
          };
        });

        console.log("🏆 Formatted leaderboard data:", formattedLeaderboard);
        setLeaderboard(formattedLeaderboard);
      } else {
        // Contract'ta henüz veri yoksa boş array
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [hookLeaderboard, address]);

  // Share cast - dokümana göre
  const handleShareCast = async () => {
    try {
      try {
        await haptics.impact('light');
      } catch (error) {
        console.log("Haptic impact failed:", error);
      }
      
      const result = await composeCast({
        text: `I just incremented the Monad Counter to ${counter}! 🚀`,
        embeds: [window.location.href]
      });
      
      if (result && typeof result === 'object' && 'cast' in result) {
        toast.success("Cast shared!");
        try {
          await haptics.notification('success');
        } catch (error) {
          console.log("Haptic notification failed:", error);
        }
      }
    } catch (error) {
      console.error("Failed to share cast:", error);
      try {
        await haptics.notification('error');
      } catch (hapticError) {
        console.log("Haptic error failed:", hapticError);
      }
    }
  };


  // Transaction sonuçlarını handle et
  useEffect(() => {
    if (hash && processedHashRef.current !== hash) {
      // Bu hash'i daha önce işlemedik, işle ve kaydet
      processedHashRef.current = hash;
      
      // Timeout'u temizle - işlem başarılı
      if (transactionTimeoutRef.current) {
        clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
      
      console.log("✅ Transaction sent:", hash);
      toast.dismiss("tx-loading");
      toast.success("Transaction sent!", { duration: 2000 });
      
      // Haptic feedback'i güvenli şekilde çağır
      (async () => {
        try {
          await haptics.notification('success');
        } catch (error) {
          console.log("Haptic notification failed:", error);
        }
      })();
      
      // Counter'ı güncelle ve leaderboard'ı refresh et
      setTimeout(() => {
        try {
          fetchCounter();
          refreshData(); // Contract verilerini yenile
        } catch (error) {
          console.error("Failed to refresh data:", error);
        }
        setIsTransactionPending(false);
      }, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, haptics]); // fetchCounter ve refreshData kasıtlı olarak dependency'de değil - loop'u önlemek için

  useEffect(() => {
    if (writeError) {
      // Timeout'u temizle - işlem hata verdi
      if (transactionTimeoutRef.current) {
        clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
      
      console.error("Transaction failed:", writeError);
      toast.dismiss("tx-loading");
      
      // Genişletilmiş cancel detection
      const errorMessage = writeError.message?.toLowerCase() || '';
      const errorName = (writeError as Error & { name?: string })?.name?.toLowerCase() || '';
      const errorCode = (writeError as Error & { code?: number | string })?.code;
      
      const isCancelled = errorMessage.includes("user rejected") || 
                         errorMessage.includes("user denied") || 
                         errorMessage.includes("cancelled") ||
                         errorMessage.includes("rejected by user") ||
                         errorMessage.includes("user cancelled") ||
                         errorMessage.includes("rejected the request") ||
                         errorMessage.includes("transaction rejected") ||
                         errorMessage.includes("user rejected transaction") ||
                         errorMessage.includes("denied by the user") ||
                         errorMessage.includes("cancelled by user") ||
                         errorName.includes("userrejected") ||
                         errorCode === 4001 || // MetaMask user rejection code
                         errorCode === "ACTION_REJECTED"; // WalletConnect rejection
      
      if (isCancelled) {
        console.log("✅ Transaction cancelled by user - loading cleared immediately");
        (async () => {
          try {
            await haptics.notification('warning');
          } catch (error) {
            console.log("Haptic warning failed:", error);
          }
        })();
      } else {
        toast.error("Transaction failed", { duration: 3000 });
        (async () => {
          try {
            await haptics.notification('error');
          } catch (error) {
            console.log("Haptic error failed:", error);
          }
        })();
      }
      setIsTransactionPending(false);
    }
  }, [writeError, haptics]);

  // Counter'ı periyodik olarak güncelle
  useEffect(() => {
    fetchCounter();
    const interval = setInterval(fetchCounter, 15000);
    return () => clearInterval(interval);
  }, [contractAddress, fetchCounter]);

  // Hook'tan gelen leaderboard verisini otomatik güncelle
  useEffect(() => {
    if (hookLeaderboard) {
      fetchLeaderboard();
    }
  }, [hookLeaderboard, fetchLeaderboard]);

  // Cleanup - component unmount olduğunda timeout'u temizle
  useEffect(() => {
    return () => {
      if (transactionTimeoutRef.current) {
        clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
    };
  }, []);

  // Dokümana göre: ready() çağrısını uygulama tamamen yüklendikten sonra yap
  useEffect(() => {
    if (!isInitialDataLoaded) {
      // Component mount olduktan sonra kısa bir süre bekle ki UI render olsun
      const timer = setTimeout(async () => {
        setIsInitialDataLoaded(true);
        
        // Dokümana göre - uygulama görüntülenmeye hazır olduğunda çağır
        await callReady();
        console.log("✅ App fully loaded and ready - ready() called");
      }, 100); // 100ms UI'ın render olması için yeterli

      return () => clearTimeout(timer);
    }
  }, [isInitialDataLoaded, callReady]);

  // SafeAreaInsets - dokümana göre  
  const safeAreaStyle = React.useMemo(() => {
    if (isInMiniApp && context?.client?.safeAreaInsets) {
      const insets = context.client.safeAreaInsets;
      return {
        paddingTop: `${insets.top}px`,
        paddingBottom: `${insets.bottom}px`,
        paddingLeft: `${insets.left}px`,
        paddingRight: `${insets.right}px`,
      };
    }
    return {};
  }, [isInMiniApp, context]);
  
  return (
      <div
      className={`min-h-screen flex flex-col ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-gray-900"
        }`}
      style={safeAreaStyle}
      >
      {/* Header */}
        <div className="w-full p-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-purple-600">
              Monad Counter
            </h1>
          </div>
            <WalletButton />
          </div>
        </div>

      {/* Main Counter */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div 
          className={`cursor-pointer py-8 px-6 text-center transition-all duration-200 ${
            isTransactionPending ? "pointer-events-none opacity-70 scale-95" : "hover:scale-105"
          }`}
          onClick={handleIncrement}
        >
          {/* Chain warning */}
              {isConnected && chainId !== MONAD_CHAIN_ID && (
            <div className="mb-6 p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                  <div className="text-orange-800 dark:text-orange-200 text-sm font-medium">
                    ⚠️ Wrong Network
                  </div>
                  <div className="text-orange-600 dark:text-orange-300 text-xs mt-1">
                Please switch to Monad Testnet
                  </div>
                </div>
              )}
              
          {/* Counter value */}
          <div className="mb-4">
            <div className="text-6xl md:text-8xl font-bold font-mono text-purple-600">
              {counter.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </div>
          </div>
          
          <div className="text-sm text-gray-500 flex items-center justify-center gap-2">
            {isTransactionPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                Transaction pending...
              </>
            ) : (
              isConnected ? "Tap to increment" : "Connect wallet to increment"
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="w-full p-6">
        <div className="flex items-center justify-center gap-6 text-sm">
          {isInMiniApp && (
            <button 
              onClick={handleShareCast}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              Share Cast
            </button>
          )}
          <button 
            onClick={() => {
              setIsLeaderboardOpen(true);
              fetchLeaderboard();
            }}
            className={`${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"} transition-colors`}
            >
              Leaderboard
            </button>
            <button 
              onClick={() => setIsHowItWorksOpen(true)}
            className={`${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"} transition-colors`}
            >
              How it works
            </button>
          </div>
        </div>
        
        {/* Modals */}
      {isLeaderboardOpen && (
          <LeaderboardModal 
          onClose={() => setIsLeaderboardOpen(false)}
          leaderboard={leaderboard}
          loading={leaderboardLoading}
            theme={theme}
            address={address}
            userStats={userStats}
            userRank={userRank}
            rankDetails={rankDetails}
            contributionTarget={contributionTarget}
          />
        )}
      
        {isHowItWorksOpen && (
          <HowItWorksModal
            onClose={() => setIsHowItWorksOpen(false)}
            theme={theme}
          fee={parseEther('0.005')}
          />
        )}
      </div>
  );
}
