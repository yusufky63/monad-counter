"use client";

import { useFrame } from "../providers/FrameProvider";
import { sdk } from "@farcaster/miniapp-sdk";

export function useMiniAppContext() {
  const { isSDKLoaded, isInMiniApp, user } = useFrame();
  
  return {
    actions: sdk.actions, // Direct access to SDK actions
    isSDKLoaded,
    isInMiniApp,
    user
  };
} 