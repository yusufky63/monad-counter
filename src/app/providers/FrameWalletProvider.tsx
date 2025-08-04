"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

// Basit RPC yapılandırması
const MONAD_RPC = "https://testnet-rpc.monad.xyz";

// Warpcast dokümantasyonuna uygun basit config
export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(MONAD_RPC, {
      timeout: 20000, // Daha uzun timeout
      retryCount: 3, // Hata durumunda tekrar dene
      fetchOptions: {
        cache: "no-cache", // Önbellek sorunlarını önle
      },
    }),
  },
  connectors: [
    farcasterFrame(), // Farcaster için - her zaman ilk sırada
    injected(), // Tarayıcı cüzdanları için
    metaMask(), // MetaMask özel desteği
  ],
  // Add custom configuration for better Farcaster compatibility
  ssr: false, // Disable SSR for Farcaster compatibility
});

// Sade sorgu yapılandırması
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
