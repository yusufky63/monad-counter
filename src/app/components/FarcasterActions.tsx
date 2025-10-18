"use client";

import { sdk } from "@farcaster/miniapp-sdk";

// Simplified Mini App environment utilities
async function isInMiniAppEnvironment() {
  try {
    return await sdk.isInMiniApp();
  } catch (error) {
    console.warn("Failed to detect Mini App environment:", error);
    return false;
  }
}

// Haptic feedback removed

// Automatic Mini App Addition Utility
export async function autoAddMiniApp() {
  try {
    const isInMiniApp = await isInMiniAppEnvironment();
    if (!isInMiniApp) return;

    const context = await sdk.context;
    const capabilities = await sdk.getCapabilities();
    
    // Only auto-add if not already added and capability exists
    if (!context.client?.added && capabilities.includes('actions.addMiniApp')) {
      console.log("🏠 Auto-adding Mini App to Farcaster");
      await sdk.actions.addMiniApp();
      console.log("✅ Mini App auto-added successfully");
    }
  } catch (error) {
    console.log("Auto add Mini App failed (optional):", error);
  }
}