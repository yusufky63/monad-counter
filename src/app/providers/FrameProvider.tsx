"use client";

import { FrameContext } from "@farcaster/frame-core/dist/context";
import enhancedSdk from "../services/farcaster";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import FrameWalletProvider from "./FrameWalletProvider";

interface FrameContextValue {
  context: FrameContext | null;
  isSDKLoaded: boolean;
  isEthProviderAvailable: boolean;
  error: string | null;
  actions: typeof enhancedSdk.actions | null;
  isInMiniApp: boolean;
  user: { fid: number; username?: string; displayName?: string; pfpUrl?: string } | null;
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
  const [context, setContext] = useState<FrameContext | null>(null);
  const [actions, setActions] = useState<typeof enhancedSdk.actions | null>(null);
  const [isEthProviderAvailable, setIsEthProviderAvailable] =
    useState<boolean>(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [user, setUser] = useState<{ fid: number; username?: string; displayName?: string; pfpUrl?: string } | null>(null);

  // Call ready() immediately when component mounts if in Farcaster environment
  useEffect(() => {
    const callReadyImmediate = async () => {
      if (typeof window !== 'undefined' && window.parent !== window) {
        try {
          await enhancedSdk.actions.ready();
          console.log("Early ready() call successful");
        } catch (error) {
          console.log("Early ready() call failed:", error);
        }
      }
    };
    callReadyImmediate();
  }, []);

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
          
          // Call ready() immediately to hide splash screen
          try {
            await enhancedSdk.actions.ready();
          } catch (readyError) {
            console.error("Failed to call ready():", readyError);
          }
          
          // Get context and user info
          const context = await enhancedSdk.context;
          if (context) {
            setContext(context as FrameContext);
            setActions(enhancedSdk.actions);
            setIsEthProviderAvailable(!!enhancedSdk.wallet?.ethProvider);
            
            // Extract user info from context
            if (context.user) {
              setUser({
                fid: context.user.fid,
                username: context.user.username,
                displayName: context.user.displayName,
                pfpUrl: context.user.pfpUrl
              });
            }
            
            // Auto-add mini app on first load (if supported)
            try {
              const wasAdded = localStorage.getItem('monad-counter-miniapp-added');
              if (!wasAdded) {
                await enhancedSdk.actions.addMiniApp();
                localStorage.setItem('monad-counter-miniapp-added', 'true');
                console.log("Mini app automatically added");
              }
            } catch (addError) {
              console.log("Auto add mini app failed:", addError);
              // This is expected in development or if user rejects
            }
          }
        } else {
          console.log("Running in regular web environment");
          setActions(null);
        }
      } catch (err) {
        console.error("SDK initialization error:", err);
        setError(err instanceof Error ? err.message : "SDK initialization failed");
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
        actions,
        isSDKLoaded,
        isEthProviderAvailable,
        error,
        isInMiniApp,
        user,
      }}
    >
      <FrameWalletProvider>{children}</FrameWalletProvider>
    </FrameProviderContext.Provider>
  );
} 