# Farcaster Integration for Monad Counter

This document provides instructions for integrating the Monad Counter app with Farcaster as a mini-app.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_URL=https://your-app-domain.com
```

During local development, you can use tools like Cloudflared or ngrok to expose your local server:

```bash
# Install Cloudflared (Windows/macOS/Linux)
# Visit https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/ 

# Run the tunnel
cloudflared tunnel --url http://localhost:3000
```

Use the provided URL in your `.env.local` file.

### 2. Image Assets

Add the following image assets to the `/public/images/` directory:

- `icon.png`: App icon (square, 200px × 200px recommended)
- `feed.png`: Preview image shown in feeds (3:2 ratio, 1200px × 800px recommended)
- `splash.png`: Splash screen image (square, 200px × 200px recommended)

### 3. Register Your App on Farcaster

1. Visit [Warpcast's Developer Tools](https://warpcast.com/~/developers/frames)
2. Enter your app details and domain
3. Copy the generated credentials to `src/app/api/farcaster.json/route.ts`

Update the `accountAssociation` section with the values from Warpcast:

```typescript
accountAssociation: {
  "header": "YOUR_HEADER_FROM_WARPCAST",
  "payload": "YOUR_PAYLOAD_FROM_WARPCAST",
  "signature": "YOUR_SIGNATURE_FROM_WARPCAST"
},
```

### 4. Testing Your Integration

To test your Farcaster mini-app:

1. Deploy your app or expose your local server
2. Visit the [Warpcast Embed Tool](https://warpcast.com/~/developers/embeds)
3. Enter your app URL and click "Preview"

### 5. Publishing Your Mini-App

Once you're satisfied with your app:

1. Ensure your app is deployed to its final domain
2. Make sure the `/.well-known/farcaster.json` endpoint works correctly
3. Your app should now be discoverable in Farcaster clients

## Features

The Monad Counter mini-app includes the following Farcaster-specific features:

1. **Share to Farcaster**: Users can share their counter interactions on Farcaster
2. **Add to Favorites**: Users can add the mini-app to their favorites for quick access
3. **Frame-Ready**: The app is properly configured to run within the Farcaster frame

## Troubleshooting

If you encounter issues with your Farcaster integration:

1. Check that your `.well-known/farcaster.json` endpoint returns the correct data
2. Verify that your app URL is correctly set in the meta tags
3. Ensure your app is calling the `ready()` action when loaded
4. Check that the Farcaster-specific meta tags are present in your HTML

## Resources

- [Farcaster Mini App Documentation](https://docs.farcaster.xyz/hub/frames)
- [Monad Farcaster Mini App Guide](https://docs.monad.xyz/guides/farcaster-miniapp)
- [Warpcast Developer Tools](https://warpcast.com/~/developers) 