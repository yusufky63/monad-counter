"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Farcaster Mini App connector - dokümana göre
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

// Monad Testnet RPC configuration
const MONAD_RPC = "https://testnet-rpc.monad.xyz";

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
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(MONAD_RPC, {
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
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
