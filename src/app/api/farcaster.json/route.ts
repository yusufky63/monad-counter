import { NextResponse } from 'next/server';

export async function GET() {
  // Ensure we use HTTPS for all URLs
  const appUrl = (process.env.NEXT_PUBLIC_URL || 'https://monad-counter.vercel.app').replace('http://', 'https://');
  
  const farcasterConfig = {
    // You'll need to generate these values using Warpcast developer tools
    // Visit https://warpcast.com/~/developers/frames to generate them
    accountAssociation: {
      "header": "eyJmaWQiOjg2NDc5MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweENjZTJFMjI5NzNmMUY1MTA5MjQzQTZiNkREZTdBNDk4QzlENjYzNjYifQ",
      "payload": "eyJkb21haW4iOiJtb25hZC1jb3VudGVyLnZlcmNlbC5hcHAifQ",
      "signature": "MHgyMjMyYWRmMWY5NTJiN2UxM2UwYzU3YTdlNGNiNmNlODNhNWIzMjk5ZDY1YjQyZjJkNDZiY2FmNmZmZmYyM2ZhNThiZjRkNGU2OThmYTM4OWVlM2RhNmIwYjZkODAyNjdmOGMyMWEyNDIwMDhkM2RlMjlkNjMxMzYyYjI4NjUwMzFj"
    },
    miniapp: {
      version: "1",
      name: "Monad Counter",
      description: "On-chain counter mini-app for Monad and Farcaster.",
      iconUrl: "https://monad-counter.vercel.app/images/icon.png",
      homeUrl: appUrl,
      imageUrl: "https://monad-counter.vercel.app/images/feed.png",
      screenshotUrls: [
        "https://monad-counter.vercel.app/images/feed.png"
      ],
      tags: ["monad", "counter", "blockchain", "web3", "on-chain"],
      primaryCategory: "utility",
      buttonTitle: "Launch Counter",
      splashImageUrl: "https://monad-counter.vercel.app/images/splash.png",
      splashBackgroundColor: "#181028"
    }
  };

  return NextResponse.json(farcasterConfig);
} 