"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

// Create configuration with both Farcaster connector for warpcast
// and multiple browser wallet connectors for better compatibility
export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz", {
      batch: {
        batchSize: 1, // Reduce batch size to avoid rate limiting
        wait: 10,     // Add delay between requests
      },
      timeout: 15000, // Increase timeout
      retryCount: 3,  // Add retries
    }),
  },
  connectors: [
    // The ID for this connector will be 'farcaster' in the client
    farcasterFrame(),
    
    // Browser wallet connectors
    injected(),
    metaMask(),
  ],
});

const queryClient = new QueryClient();

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