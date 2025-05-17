import { NextResponse } from 'next/server';

export async function GET() {
  // Ensure we use HTTPS for all URLs
  const appUrl = (process.env.NEXT_PUBLIC_URL || 'https://monad-counter.vercel.app').replace('http://', 'https://');
  
  const farcasterConfig = {
    // You'll need to generate these values using Warpcast developer tools
    // Visit https://warpcast.com/~/developers/frames to generate them
    accountAssociation: {
      "header": "eyJmaWQiOjg2NDc5MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweENjZTJFMjI5NzNmMUY1MTA5MjQzQTZiNkREZTdBNDk4QzlENjYzNjYifQ",
    "payload": "eyJkb21haW4iOiJvdXJzZWx2ZXMtcmVjb2duaXplZC1zdWJzdGl0dXRlLWNhc2V5LnRyeWNsb3VkZmxhcmUuY29tIn0",
    "signature": "MHhjYmRjZDY5MmE3YTgyNGNiNzZlYThlY2ViZmZkZGQ4YmE3NGZhZGUwMDcxMzkxM2Q3OWU3MTliZDRiNmQwZmU0NTdjNGU2Njk3NzE5ZGI0ZDIwOTViZGJhZWVhNTlmYzUwYTgxMGNhOWZlYTFlODZjMzY2NjU4NWU4OTA0OWY2NzFi"
  },
    frame: {
      version: "1",
      name: "Monad Counter",
      iconUrl: `${appUrl}/images-png/icon.png`, // Icon of the app in the app store
      homeUrl: `${appUrl}`, // Default launch URL
      imageUrl: `${appUrl}/images-png/feed.png`, // Default image to show if shared in a feed.
      screenshotUrls: [], // Visual previews of the app
      tags: ["monad", "counter", "blockchain", "web3", "on-chain"], // Descriptive tags for search
      primaryCategory: "utility",
      buttonTitle: "Launch Counter",
      splashImageUrl: `${appUrl}/images-png/splash.png`, // URL of image to show on loading screen.	
      splashBackgroundColor: "#9747FF", // Hex color code to use on loading screen.
    }
  };

  return NextResponse.json(farcasterConfig);
} 