"use client";

import React, { ReactNode, useContext, useEffect, useState, createContext } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { autoAddMiniApp } from "../components/FarcasterActions";

// Simplified Mini App types
interface MiniAppUser {
  fid: number;
  username?: string;
  displayName?: string;
}

interface FrameContextValue {
  isSDKLoaded: boolean;
  isInMiniApp: boolean;
  user: MiniAppUser | null;
  isReadyCalled: boolean;
  callReady: () => Promise<void>;
}

const FrameProviderContext = createContext<FrameContextValue | undefined>(
  undefined
);

export function useFrame() {
  const context = useContext(FrameProviderContext);
  if (context === undefined) {
    throw new Error("useFrame must be used within a FrameProvider");
  }
  return context;
}

interface FrameProviderProps {
  children: ReactNode;
}

export function FrameProvider({ children }: FrameProviderProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [user, setUser] = useState<MiniAppUser | null>(null);
  const [isReadyCalled, setIsReadyCalled] = useState(false);

  // Haptics removed

  // Simplified ready() call according to docs
  const callReady = async () => {
    if (!isReadyCalled) {
      try {
        console.log("🚀 Calling sdk.actions.ready()");
        await sdk.actions.ready();
        setIsReadyCalled(true);
        
        // Auto-add Mini App after ready
        setTimeout(() => {
          autoAddMiniApp();
        }, 2000); // 2 seconds after ready
        
        console.log("✅ SDK ready() completed successfully");
      } catch (error) {
        console.error("❌ Failed to call ready():", error);
        setIsReadyCalled(true); // Mark as called anyway
      }
    }
  };

  // Simplified SDK initialization
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const isMiniApp = await sdk.isInMiniApp();
        setIsInMiniApp(isMiniApp);
        
        if (isMiniApp) {
          const context = await sdk.context;
          if (context?.user) {
            setUser({
              fid: context.user.fid,
              username: context.user.username,
              displayName: context.user.displayName,
            });
          }
        }
      } catch (error) {
        console.error("SDK initialization error:", error);
      } finally {
        setIsSDKLoaded(true);
      }
    };

    initializeSDK();
  }, []);

  return (
    <FrameProviderContext.Provider
      value={{
        isSDKLoaded,
        isInMiniApp,
        user,
        isReadyCalled,
        callReady,
      }}
    >
      {children}
    </FrameProviderContext.Provider>
  );
} 