"use client";

import { useFrame } from "../providers/FrameProvider";

export function useMiniAppContext() {
  const { context, actions, isEthProviderAvailable, isSDKLoaded, error } = useFrame();
  
  return {
    context,
    actions,
    isEthProviderAvailable,
    isSDKLoaded,
    error
  };
} 