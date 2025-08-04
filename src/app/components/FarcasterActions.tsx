"use client";

import React, { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

// Set the app URL for sharing - using specific Vercel deployment
const APP_URL = "https://monad-counter.vercel.app";

function isWarpcastEnv() {
  if (typeof window === "undefined") return false;
  return window.parent !== window;
}

// Add to Home Prompt Modal
export function AddToHomePrompt({ onClose }: { onClose: () => void }) {
  const [isAddingToHome, setIsAddingToHome] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToHome = async () => {
    try {
      setIsAddingToHome(true);
      setError(null);
      
      await sdk.actions.addMiniApp();
      setAddSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to add to home:", error);
      setError(error instanceof Error ? error.message : "Failed to add app");
      setIsAddingToHome(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-5 max-w-xs w-full flex flex-col items-center">
        {addSuccess ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4ade80"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3 className="text-white text-lg font-bold mt-3">
              Added Successfully!
            </h3>
            <p className="text-gray-300 text-center my-3">
              Monad Counter has been added to your Farcaster Home
            </p>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            <h3 className="text-white text-lg font-bold mt-3">
              Add to Farcaster
            </h3>
            <p className="text-gray-300 text-center my-3">
              Add Monad Counter to your Farcaster Home for easy access next time!
            </p>
            
            {error && (
              <div className="w-full mt-2 py-2 px-3 bg-red-600/20 text-red-400 text-sm rounded-md text-center">
                {error}
              </div>
            )}
            
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={onClose}
                disabled={isAddingToHome}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Later
              </button>
              <button
                onClick={handleAddToHome}
                disabled={isAddingToHome}
                className="flex-1 bg-[#9747FF] hover:bg-[#8A32FF] text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-70 flex justify-center items-center"
              >
                {isAddingToHome ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  "Add Now"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function FarcasterShareButton({
  counterValue,
}: {
  counterValue: string;
}) {
  if (!isWarpcastEnv()) return null;

  const handleShare = async () => {
    try {
      await sdk.actions.composeCast({
        text: `I just incremented the Monad Counter to ${counterValue}! 🚀\nTry it yourself:`,
        embeds: [`${APP_URL}`],
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="bg-[#9747FF] hover:bg-[#8A32FF] text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 w-full text-sm font-medium shadow transition-all duration-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
      Share Counter
      <span className="font-mono text-white bg-purple-500/40 px-1.5 py-0.5 rounded text-xs">
        {counterValue}
      </span>
    </button>
  );
}

// Add to Home button for Warpcast
export function AddToHomeButton() {
  const [isAddingToHome, setIsAddingToHome] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyAdded, setIsAlreadyAdded] = useState(false);

  // Check if app is already added on mount
  useEffect(() => {
    const wasAdded = localStorage.getItem('monad-counter-miniapp-added');
    if (wasAdded) {
      setIsAlreadyAdded(true);
    }
  }, []);

  if (!isWarpcastEnv()) return null;

  // Don't show button if already added
  if (isAlreadyAdded) {
    return (
      <div className="mt-2 py-2 px-3 bg-green-600/20 text-green-400 text-sm rounded-md flex items-center justify-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        Already added to Farcaster Home
      </div>
    );
  }

  const handleAddToHome = async () => {
    try {
      setIsAddingToHome(true);
      setShowFeedback(true);
      setError(null);

      await sdk.actions.addMiniApp();
      setAddSuccess(true);
      setIsAlreadyAdded(true);
      localStorage.setItem('monad-counter-miniapp-added', 'true');
      
      setTimeout(() => {
        setShowFeedback(false);
        setIsAddingToHome(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to add to home:", error);
      setError(error instanceof Error ? error.message : "Failed to add app");
      setShowFeedback(false);
      setIsAddingToHome(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAddToHome}
        disabled={isAddingToHome}
        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 w-full text-sm font-medium shadow transition-all duration-200 mt-2 disabled:opacity-70"
      >
        {isAddingToHome ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Add to Farcaster Home
          </>
        )}
      </button>

      {/* Success feedback */}
      {showFeedback && addSuccess && (
        <div className="mt-2 py-2 px-3 bg-green-600/20 text-green-400 text-sm rounded-md flex items-center justify-center gap-2 animate-fadeIn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Added to Farcaster Home
        </div>
      )}

      {/* Error feedback */}
      {showFeedback && error && !isAddingToHome && (
        <div className="mt-2 py-2 px-3 bg-red-600/20 text-red-400 text-sm rounded-md flex items-center justify-center gap-2 animate-fadeIn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
    </>
  );
}

export function FarcasterShareFooter({
  counterValue,
}: {
  counterValue: string;
}) {
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  if (!isWarpcastEnv()) return null;

  return (
    <>
      <div className="w-full flex flex-col items-center mt-4">
        <div className="max-w-xs w-full">
          <FarcasterShareButton counterValue={counterValue} />
          <AddToHomeButton />
        </div>
      </div>

      {/* Prompt modal */}
      {showAddPrompt && (
        <AddToHomePrompt onClose={() => setShowAddPrompt(false)} />
      )}
    </>
  );
}
