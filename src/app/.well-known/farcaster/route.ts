import { NextResponse } from 'next/server';

export async function GET() {
  // Replace with your actual credentials from Warpcast's developer tools
  // Visit https://warpcast.com/~/developers/new to get your account association details
  const appUrl = process.env.NEXT_PUBLIC_URL;
  
  const farcasterConfig = {
    // You'll need to fill these with your credentials from Warpcast
    accountAssociation: {
      "header": "",
      "payload": "",
      "signature": ""
    },
    frame: {
      version: "1",
      name: "Monad Counter",
      iconUrl: `${appUrl}/images/icon.png`,
      homeUrl: `${appUrl}`,
      imageUrl: `${appUrl}/images/feed.png`,
      screenshotUrls: [], 
      tags: ["monad", "counter", "blockchain"],
      primaryCategory: "utilities",
      buttonTitle: "Launch Counter",
      splashImageUrl: `${appUrl}/images/splash.png`,
      splashBackgroundColor: "#10B981", // A green color matching Monad
    }
  };

  return NextResponse.json(farcasterConfig);
} 