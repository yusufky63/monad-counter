"use client";

import React, { ReactNode, useContext, useEffect, useState, useCallback, createContext } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface FrameContextValue {
  isSDKLoaded: boolean;
  isInMiniApp: boolean;
  user: { fid: number; username?: string; displayName?: string; pfpUrl?: string } | null;
  context: Awaited<typeof sdk.context> | null;
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
  const [user, setUser] = useState<{ fid: number; username?: string; displayName?: string; pfpUrl?: string } | null>(null);
  const [context, setContext] = useState<Awaited<typeof sdk.context> | null>(null);

  // Function to detect if we're in Farcaster environment
  const isInFarcaster = useCallback(() => {
    return typeof window !== 'undefined' && window.parent !== window;
  }, []);

  // Farcaster SDK initialization
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Check if we're in a Farcaster environment
        const isMiniApp = isInFarcaster();
        setIsInMiniApp(isMiniApp);
        
        if (isMiniApp) {
          console.log("Initializing Farcaster Mini App SDK...");
          
          // Get context
          const sdkContext = await sdk.context;
          setContext(sdkContext);
          
          // Extract user info from context
          if (sdkContext?.user) {
            setUser({
              fid: sdkContext.user.fid,
              username: sdkContext.user.username,
              displayName: sdkContext.user.displayName,
              pfpUrl: sdkContext.user.pfpUrl
            });
          }
          
          // Call ready() to hide splash screen - THIS IS CRITICAL
          try {
            await sdk.actions.ready();
            console.log("SDK ready() called successfully - splash screen should be hidden");
          } catch (readyError) {
            console.error("Failed to call ready():", readyError);
          }
          
          // Auto-add mini app on first load (if supported)
          try {
            const wasAdded = localStorage.getItem('monad-counter-miniapp-added');
            if (!wasAdded) {
              await sdk.actions.addMiniApp();
              localStorage.setItem('monad-counter-miniapp-added', 'true');
              console.log("Mini app automatically added");
            }
          } catch (addError) {
            console.log("Auto add mini app failed:", addError);
            // This is expected in development or if user rejects
          }
        } else {
          console.log("Running in regular web environment");
        }
      } catch (err) {
        console.error("SDK initialization error:", err);
      } finally {
        setIsSDKLoaded(true);
      }
    };

    initializeSDK();
  }, [isInFarcaster]);

  return (
    <FrameProviderContext.Provider
      value={{
        context,
        isSDKLoaded,
        isInMiniApp,
        user,
      }}
    >
      {children}
    </FrameProviderContext.Provider>
  );
} 