"use client";

import React from 'react';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { metaMask, coinbaseWallet, walletConnect } from 'wagmi/connectors';

const isWarpcast = typeof window !== 'undefined' && (window.parent !== window || window.IS_WARPCAST_ENV);

const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: isWarpcast
    ? [miniAppConnector()]
    : [
        metaMask(),
        coinbaseWallet({ appName: 'Monad Counter' }),
        walletConnect({ projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' }),
      ],
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
