"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Farcaster Mini App connector - dokümana göre
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import SupportedChains from "../config/chains";

// Define Monad Mainnet chain
const monadMainnet = {
  id: SupportedChains.monad.chainId,
  name: SupportedChains.monad.chainName,
  nativeCurrency: SupportedChains.monad.nativeCurrency,
  rpcUrls: {
    default: { http: SupportedChains.monad.rpcUrls },
  },
  blockExplorers: {
    default: {
      name: "MonadExplorer",
      url: SupportedChains.monad.blockExplorerUrls[0],
    },
  },
} as const;

// Monad Mainnet RPC configuration
const MONAD_RPC = SupportedChains.monad.rpcUrls[0];

// Lazy connector initialization - timing sorunlarını önlemek için
const getConnectors = () => {
  try {
    return [
      farcasterMiniApp(), // Farcaster Mini App connector
      injected(),
      metaMask(),
    ];
  } catch (error) {
    console.warn("Some connectors failed to initialize:", error);
    // Fallback connectors
    return [injected()];
  }
};

// Wagmi configuration following Farcaster Mini App docs
export const config = createConfig({
  chains: [monadMainnet],
  transports: {
    [monadMainnet.id]: http(MONAD_RPC, {
      timeout: 20000,
      retryCount: 3,
      fetchOptions: {
        cache: "no-cache",
      },
    }),
  },
  connectors: getConnectors(),
  ssr: false, // SSR'ı devre dışı bırak
});

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export default function FrameWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
