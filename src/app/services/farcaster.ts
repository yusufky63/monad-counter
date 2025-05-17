"use client";
import React, { useContext } from "react";
import { sdk } from '@farcaster/frame-sdk';

/**
 * Simple Farcaster SDK for our Monad Counter application
 */

// Define basic Farcaster context types
export interface FarcasterContext {
  user: {
    fid: number | null;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
  };
  client: {
    safeAreaInsets: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
}

// Define basic Farcaster actions
export interface FarcasterActions {
  ready: () => Promise<void>;
  addFrame: () => Promise<void>;
  composeCast: (options: { text: string }) => Promise<void>;
  viewProfile: (options: { fid: number }) => Promise<void>;
}

// Create Farcaster SDK singleton
class FarcasterSDK {
  private _context: FarcasterContext = {
    user: {
      fid: null,
      username: null,
      displayName: null,
      pfpUrl: null,
    },
    client: {
      safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    },
  };

  private _actions: FarcasterActions = {
    ready: async () => {
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage({ type: 'ready' }, '*');
        console.log("Farcaster: ready action sent");
      }
    },
    addFrame: async () => {
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage({ type: 'addFrame' }, '*');
        console.log("Farcaster: addFrame action sent");
      }
    },
    composeCast: async (options: { text: string }) => {
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage({ type: 'composeCast', data: options }, '*');
        console.log("Farcaster: composeCast action sent", options);
      }
    },
    viewProfile: async (options: { fid: number }) => {
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage({ type: 'viewProfile', data: options }, '*');
        console.log("Farcaster: viewProfile action sent", options);
      }
    },
  };

  // For listening to incoming messages from Farcaster client
  initialize() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMessage.bind(this));
      console.log("Farcaster SDK initialized and waiting for messages");
    }
  }

  private handleMessage(event: MessageEvent) {
    // Handle Farcaster-specific messages here
    if (event.data && event.data.type === 'context') {
      this._context = { ...this._context, ...event.data.data };
      console.log("Received Farcaster context", this._context);
    }
  }

  get context() {
    return this._context;
  }

  get actions() {
    return this._actions;
  }
}

// Export singleton instance
export const farcasterSDK = new FarcasterSDK();

// Farcaster SDK context
const FarcasterContext = React.createContext(sdk);
export const useFarcaster = () => useContext(FarcasterContext);

export default sdk; 