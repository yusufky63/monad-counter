"use client";

import React from "react";
import Image from "next/image";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { sdk } from '@farcaster/frame-sdk';

type FarcasterUser = {
  fid?: number | null;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
};

type FarcasterContext = {
  user: FarcasterUser;
  client: {
    safeAreaInsets?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
};

function isWarpcastEnv() {
  if (typeof window === 'undefined') return false;
  return window.parent !== window || !!window.IS_WARPCAST_ENV;
}

function isInMiniApp() {
  return typeof window !== 'undefined' && window.parent !== window;
}

export default function WalletButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = React.useState(false);
  const [fcUser, setFcUser] = React.useState<FarcasterContext["user"] | null>(null);
  const [signingIn, setSigningIn] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Farcaster bağlantısı ve durum yönetimi
  const getFarcasterContext = React.useCallback(async () => {
    if (!isInMiniApp()) return false;
    
    try {
      const ctx: FarcasterContext = await sdk.context;
      if (ctx && ctx.user && ctx.user.fid) {
        setFcUser(ctx.user);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Error getting Farcaster context:", err);
      return false;
    }
  }, []);

  // Warpcast'te sign-in sürecini başlat
  const signInWithFarcaster = React.useCallback(async () => {
    if (signingIn) return;
    setErrorMessage(null);
    setSigningIn(true);
    
    try {
      if (!sdk || !sdk.actions || typeof sdk.actions.signIn !== 'function') {
        throw new Error("Farcaster SDK not initialized properly");
      }

      // Warpcast'in SignIn metodunu çağır - bu kullanıcının Farcaster hesabını doğrular
      await sdk.actions.signIn({ 
        nonce: Date.now().toString() 
      });
      
      // Kısa bekle
      await new Promise(r => setTimeout(r, 500));
      
      // Context'i al ve kullanıcı bilgisini güncelle
      const success = await getFarcasterContext();
      
      if (!success) {
        console.warn("No user found after sign-in. Retrying...");
        // Tekrar context almayı dene
        setTimeout(async () => {
          await getFarcasterContext();
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to sign in with Farcaster:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to connect with Farcaster");
    } finally {
      setSigningIn(false);
    }
  }, [getFarcasterContext, signingIn]);

  // Sayfa yüklendiğinde ve focus değiştiğinde context'i kontrol et
  React.useEffect(() => {
    if (!isInMiniApp()) return;

    // İlk yükleme - context'i kontrol et
    getFarcasterContext();
    
    // Warpcast mini-app içinde olduğumuzdan emin ol ve SDK ready işaretini yap
    if (typeof sdk?.actions?.ready === 'function') {
      sdk.actions.ready().catch(e => console.warn("Ready call failed:", e));
    }
    
    // Pencere odağını geri aldığında context'i yenile
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', getFarcasterContext);
      return () => window.removeEventListener('focus', getFarcasterContext);
    }
  }, [getFarcasterContext]);
  
  // Warpcast içinde butonu göster
  if (isWarpcastEnv() || isInMiniApp()) {
    // Eğer Farcaster kullanıcısı varsa profil göster
    if (fcUser && fcUser.fid) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white shadow border border-gray-700">
          {fcUser.pfpUrl && (
            <Image
              width={28}
              height={28}
              src={fcUser.pfpUrl}
              alt="pfp"
              className="w-7 h-7 rounded-full border border-gray-700"
            />
          )}
          <span className="font-semibold text-base truncate max-w-[140px]">{fcUser.displayName || fcUser.username || `FID: ${fcUser.fid}`}</span>
          <button
            onClick={() => {
              setFcUser(null);
            }}
            className="ml-2 p-1 rounded hover:bg-gray-800 transition-colors"
            title="Change Account"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
          </button>
        </div>
      );
    }
    
    // Farcaster kullanıcısı yoksa veya disconnect edildiyse giriş butonu göster
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={signInWithFarcaster}
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-[#624DE3] text-white hover:bg-[#5341D2] justify-center w-full"
          disabled={signingIn}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          {signingIn ? 'Connecting...' : 'Sign in with Farcaster'}
        </button>
        
        {errorMessage && (
          <p className="text-sm text-red-500 mt-1 text-center">{errorMessage}</p>
        )}
      </div>
    );
  }

  // Warpcast dışındaysak normal cüzdan bağlantı mantığını kullan
  if (isConnected) {
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white shadow border border-gray-700">
        <span
          className="font-mono text-base cursor-pointer select-all"
          onClick={() => {
            if (address) {
              navigator.clipboard.writeText(address);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }
          }}
          title={address}
        >
          {shortAddress}
        </span>
        <button
          onClick={() => disconnect()}
          className="ml-2 p-1 rounded hover:bg-gray-800 transition-colors"
          title="Disconnect"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
        </button>
        {copied && <span className="ml-2 text-xs text-green-400">Copied!</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-purple-700 text-white hover:bg-purple-800"
      >
        Connect Wallet
      </button>
      <a
        href={`https://warpcast.com/~/embed?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-[#624DE3] text-white hover:bg-[#5341D2] justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
        Sign in with Warpcast
      </a>
    </div>
  );
}
