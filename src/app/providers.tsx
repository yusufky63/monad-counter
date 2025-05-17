"use client";

import React from 'react';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [miniAppConnector()]
});

const queryClient = new QueryClient();

// Ana Provider
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
    </QueryClientProvider>
  );
}

// Global tip tanımlaması
declare global {
  interface Window {
    IS_WARPCAST_ENV?: boolean;
  }
}
