"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ThemeContext } from "./context/ThemeContext";
import { toast } from "react-hot-toast";
import {
  useAccount,
  useConnect,
  useWriteContract,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseEther } from "viem/utils";

// Components - dokümana göre
import { useFrame } from "./providers/FrameProvider";
import LeaderboardModal from "./components/LeaderboardModal";
import HowItWorksModal from "./components/HowItWorksModal";
import OtherAppsModal from "./components/OtherAppsModal";
import WalletButton from "./components/WalletButton";
// Removed unused Farcaster components

// Utils and contract
import { getContractAddress } from "./utils/ContractAddresses";
import counterABI from "./contract/ABI";
import { useCounter } from "./hooks/useCounter";

import SupportedChains from "./config/chains";

// Monad Mainnet Chain ID
const MONAD_CHAIN_ID = SupportedChains.monad.chainId;

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
  const { isSDKLoaded, isInMiniApp, callReady } = useFrame();
  const [isAppReady, setIsAppReady] = useState(false);

  // Mobile için agresif ready() çağrısı - SDK yüklenir yüklenmez
  useEffect(() => {
    if (isSDKLoaded) {
      console.log(
        "🚀 SDK loaded, calling ready() immediately for mobile compatibility"
      );

      // Mobile için hiç beklemeden ready() çağır
      (async () => {
        try {
          await callReady();
          console.log("✅ Ready called successfully");
          setIsAppReady(true);
        } catch (error) {
          console.error("❌ Ready call failed:", error);
          // Yine de app'i göster
          setIsAppReady(true);
        }
      })();
    }
  }, [isSDKLoaded, callReady]);

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
     
      </div>
    );
  }

  // Render main app
  return <CounterApp />;
}

// Ana Counter bileşeni
function CounterApp() {
  const { theme } = React.useContext(ThemeContext);
  // Haptics removed
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Connector initialization state
  const [connectorsReady, setConnectorsReady] = useState(false);

  // Counter hook
  const {
    userStats,
    userRank,
    contributionTarget,
    rankDetails,
    leaderboard: hookLeaderboard,
    refreshData,
  } = useCounter({
    chainId: MONAD_CHAIN_ID,
    address,
    isConnected,
  });

  // State
  const [counter, setCounter] = useState("0");
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isOtherAppsOpen, setIsOtherAppsOpen] = useState(false);
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

  const handleWalletConnect = async () => {
    try {
      // Haptic feedback removed

      if (isConnected) {
        if (chainId !== MONAD_CHAIN_ID) {
          await handleNetworkSwitch();
        }
        return;
      }

      // Connector'ların hazır olup olmadığını kontrol et
      if (!connectors || connectors.length === 0) {
        console.warn("No connectors available, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 saniye bekle
        if (!connectors || connectors.length === 0) {
          throw new Error("Connectors not initialized");
        }
      }

      // Farcaster Mini App connector'ını bul
      const farcasterConnector = connectors.find(
        (connector) =>
          connector.name === "farcasterMiniApp" ||
          connector.id === "farcaster" ||
          connector.name?.toLowerCase().includes("farcaster")
      );

      console.log(
        "Available connectors:",
        connectors.map((c) => ({ name: c.name, id: c.id }))
      );

      if (farcasterConnector) {
        console.log("Using Farcaster connector:", farcasterConnector.name);

        // Connector'ın getChainId metodunu kontrol et
        if (typeof farcasterConnector.getChainId !== "function") {
          console.warn(
            "Farcaster connector not fully initialized, using fallback"
          );
          await connect({ connector: connectors[0] });
        } else {
          await connect({ connector: farcasterConnector });
        }
      } else {
        console.log("Farcaster connector not found, using first available");
        // İlk kullanılabilir connector'ı kontrol et
        const firstConnector = connectors[0];
        if (firstConnector && typeof firstConnector.getChainId === "function") {
          await connect({ connector: firstConnector });
        } else {
          throw new Error("No valid connectors available");
        }
      }

      // Success notification removed
      toast.success("Wallet connected!");

      // Bağlandıktan sonra hemen Monad ağına switch et
      setTimeout(() => {
        if (chainId !== MONAD_CHAIN_ID) {
          handleNetworkSwitch();
        }
      }, 1000);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      toast.error("Failed to connect wallet");
    }
  };

  // Network switch - SADECE MONAD'A İZİN VER
  const handleNetworkSwitch = async () => {
    try {
      toast.loading(`Switching to ${SupportedChains.monad.chainName}...`, {
        id: "network-switch",
      });
      await switchChain({ chainId: MONAD_CHAIN_ID });
      toast.dismiss("network-switch");
      toast.success(`Switched to ${SupportedChains.monad.chainName}!`);
      // Success notification removed
    } catch (error) {
      toast.dismiss("network-switch");
      console.error("Network switch failed:", error);
      toast.error(
        `Please manually switch to ${SupportedChains.monad.chainName}`
      );
    }
  };

  // Counter artırma - dokümana göre
  const handleIncrement = async () => {
    if (!contractAddress || isTransactionPending) return;

    try {
      console.log("🔍 Checking prerequisites for counter increment...");

      // 1. Wallet bağlantısını kontrol et
      if (!isConnected) {
        console.log("❌ Wallet not connected, connecting...");
        await handleWalletConnect();
        return;
      }

      // 2. MONAD AĞI ZORUNLU KONTROLÜ - İşlem yapmadan önce kesinlikle kontrol et
      console.log(
        `🌐 Current network: ${chainId}, Required: ${MONAD_CHAIN_ID}`
      );
      if (chainId !== MONAD_CHAIN_ID) {
        console.log(
          `⚠️ Wrong network! Must be on ${SupportedChains.monad.chainName} for transactions`
        );
        toast(
          `⚠️ Switching to ${SupportedChains.monad.chainName} for transaction...`,
          {
            duration: 3000,
            style: { background: "#f59e0b", color: "white" },
          }
        );

        try {
          await handleNetworkSwitch();
          // Network değiştikten sonra kısa bir bekleme
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Tekrar kontrol et - hala yanlış ağdaysa işlemi durdur
          if (chainId !== MONAD_CHAIN_ID) {
            toast.error(
              `Please switch to ${SupportedChains.monad.chainName} to use the counter`
            );
            return;
          }

          console.log(
            `✅ Successfully switched to ${SupportedChains.monad.chainName}`
          );
          toast.success("Ready for transaction on Monad!", { duration: 2000 });
        } catch (error) {
          console.error("❌ Failed to switch network:", error);
          toast.error(
            `Failed to switch to ${SupportedChains.monad.chainName}. Please switch manually.`
          );
          return;
        }
      } else {
        console.log(`✅ Already on ${SupportedChains.monad.chainName}`);
      }

      // writeContract hook'unun hazır olup olmadığını kontrol et
      if (!writeContract) {
        console.error("writeContract hook not ready");
        toast.error("Wallet connection not ready, please try again");
        return;
      }

      // Connector validation
      if (!connectorsReady) {
        console.error("Connectors not fully initialized");
        toast.error("Wallet is initializing, please wait and try again");
        return;
      }

      if (connectors.length === 0) {
        console.error("No connectors available");
        toast.error("Wallet connectors not available");
        return;
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
        // Transaction gönder - extra validation
        console.log("📤 Sending transaction to contract:", contractAddress);

        const txParams = {
          address: contractAddress,
          abi: counterABI,
          functionName: "incrementCounter",
          value: parseEther(SupportedChains.monad.isFeeValue.toString()), // Fee from config
        };

        console.log("Transaction params:", txParams);
        writeContract(txParams);
      } catch (writeError: unknown) {
        // writeContract'tan gelen immediate hata
        if (transactionTimeoutRef.current) {
          clearTimeout(transactionTimeoutRef.current);
          transactionTimeoutRef.current = null;
        }

        console.error("WriteContract immediate error:", writeError);

        // Immediate cancel detection
        const errorMessage =
          (
            writeError as Error & { message?: string }
          )?.message?.toLowerCase() || "";
        const errorCode = (writeError as Error & { code?: number | string })
          ?.code;
        const isCancelledImmediate =
          errorMessage.includes("user rejected") ||
          errorMessage.includes("cancelled") ||
          errorCode === 4001;

        toast.dismiss("tx-loading");

        if (isCancelledImmediate) {
          console.log("🚫 Transaction cancelled immediately");
          // Warning notification removed
        } else {
          toast.error("Failed to send transaction", { duration: 3000 });
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
      setIsTransactionPending(false);
    }
  };

  // Counter değerini getir
  const fetchCounter = useCallback(async () => {
    if (!contractAddress) return;

    try {
      const response = await fetch(SupportedChains.monad.rpcUrls[0], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            {
              to: contractAddress,
              data: "0x61bc221a", // counter() function signature
            },
            "latest",
          ],
        }),
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
        const formattedLeaderboard = hookLeaderboard.map(
          (item: ContractLeaderboardItem, index: number) => {
            const shortAddress = `${item.userAddress.slice(
              0,
              6
            )}...${item.userAddress.slice(-4)}`;
            const isCurrentUser = address
              ? item.userAddress.toLowerCase() === address.toLowerCase()
              : false;

            // Username olarak kısa wallet adresi kullan
            const username = isCurrentUser ? "you" : shortAddress.toLowerCase();

            return {
              address: shortAddress,
              userAddress: item.userAddress, // Leaderboard.js için
              contributions: Number(item.contributions), // Leaderboard.js için
              contribution: Number(item.contributions),
              rank: index + 1, // Zaten sıralanmış olarak geliyor
              username: username,
              isCurrentUser: isCurrentUser,
            };
          }
        );

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

      // Haptic feedback removed

      // Counter'ı güncelle ve leaderboard'ı refresh et
      setTimeout(() => {
        try {
          fetchCounter();
          refreshData(); // Contract verilerini yenile
        } catch (error) {
          console.error("Failed to refresh data:", error);
        }
        setIsTransactionPending(false);

        // Transaction tamamlandı - otomatik Add Mini App artık FarcasterActions'ta
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]); // fetchCounter ve refreshData kasıtlı olarak dependency'de değil - loop'u önlemek için

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
      const errorMessage = writeError.message?.toLowerCase() || "";
      const errorName =
        (writeError as Error & { name?: string })?.name?.toLowerCase() || "";
      const errorCode = (writeError as Error & { code?: number | string })
        ?.code;

      const isCancelled =
        errorMessage.includes("user rejected") ||
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
        console.log(
          "✅ Transaction cancelled by user - loading cleared immediately"
        );
        // Warning notification removed
      } else {
        toast.error("Transaction failed", { duration: 3000 });
        // Error notification removed
      }
      setIsTransactionPending(false);
    }
  }, [writeError]);

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

  // Connector initialization watcher - connector'ların hazır olmasını bekle
  useEffect(() => {
    const checkConnectors = async () => {
      if (connectors && connectors.length > 0) {
        console.log("🔌 Checking connectors readiness...");

        // Connector'ların initialize olması için kısa bir süre bekle
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // En az bir connector'ın getChainId metoduna sahip olup olmadığını kontrol et
        const readyConnectors = connectors.filter(
          (connector) => connector && typeof connector.getChainId === "function"
        );

        if (readyConnectors.length > 0) {
          console.log("✅ Connectors ready:", readyConnectors.length);
          setConnectorsReady(true);
        } else {
          console.log("⚠️ Connectors not fully initialized, retrying...");
          // 2 saniye sonra tekrar kontrol et
          setTimeout(checkConnectors, 2000);
        }
      }
    };

    if (!connectorsReady) {
      checkConnectors();
    }
  }, [connectors, connectorsReady]);

  // ready() çağrısı artık MonadCounterApp level'da yapılıyor
  useEffect(() => {
    if (!isInitialDataLoaded) {
      // Sadece initial data yüklendi işaretini yap
      setIsInitialDataLoaded(true);
    }
  }, [isInitialDataLoaded]);

  // Simplified styling - no safe area insets needed
  const safeAreaStyle = React.useMemo(() => {
    return {};
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100"
      style={safeAreaStyle}
    >
      {/* Header */}
      <div className="w-full p-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-purple-400">
              Monad Counter
            </h1>
          </div>
          <WalletButton />
        </div>
      </div>

      {/* Main Counter */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Clean Card Container */}
        <div
          className={`
            w-full max-w-sm rounded-2xl p-8 text-center transition-all duration-300
            bg-zinc-900 border border-zinc-800 shadow-xl
            ${
              isTransactionPending ||
              !connectorsReady ||
              (isConnected && chainId !== MONAD_CHAIN_ID)
                ? "opacity-80"
                : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            }
          `}
          onClick={
            connectorsReady && (!isConnected || chainId === MONAD_CHAIN_ID)
              ? handleIncrement
              : undefined
          }
        >
          {/* Label */}
          <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-6">
            Global Count
          </div>

          {/* Counter value - Tabular nums for stability */}
          <div className="mb-8">
            <div className="text-5xl md:text-7xl font-bold font-mono tracking-tighter tabular-nums text-purple-400">
              {counter.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="h-6 flex items-center justify-center">
            {isTransactionPending ? (
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                Processing...
              </div>
            ) : isConnected && chainId !== MONAD_CHAIN_ID ? (
              <div className="flex items-center gap-2 text-sm text-amber-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                Wrong Network
              </div>
            ) : (
              <div className="text-sm text-zinc-500 font-medium">
                {isConnected ? "Tap to Increment" : "Connect to Play"}
              </div>
            )}
          </div>
        </div>

        {/* Subtle Network Warning (Outside Card) */}
        {isConnected && chainId !== MONAD_CHAIN_ID && (
          <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-950/30 text-amber-400 text-sm font-medium border border-amber-900/50">
              Please switch to {SupportedChains.monad.chainName}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full p-6 space-y-4">
        {/* Navigation Buttons */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <button
            onClick={() => {
              setIsLeaderboardOpen(true);
              fetchLeaderboard();
            }}
            className="text-zinc-400 hover:text-white transition-colors font-medium"
          >
            Leaderboard
          </button>
          <button
            onClick={() => setIsOtherAppsOpen(true)}
            className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Other Apps
          </button>
          <button
            onClick={() => setIsHowItWorksOpen(true)}
            className="text-zinc-400 hover:text-white transition-colors font-medium"
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

      {isOtherAppsOpen && (
        <OtherAppsModal
          onClose={() => setIsOtherAppsOpen(false)}
          theme={theme}
        />
      )}

      {isHowItWorksOpen && (
        <HowItWorksModal
          onClose={() => setIsHowItWorksOpen(false)}
          theme={theme}
          fee={parseEther(SupportedChains.monad.isFeeValue.toString())}
        />
      )}
    </div>
  );
}
