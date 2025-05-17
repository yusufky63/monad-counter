# Monad Counter - Farcaster Mini App Integration

This README provides the necessary steps to integrate the Monad Counter app with Farcaster as a mini-app.

## Prerequisites

- Your Next.js app should be deployed to a public URL
- A Farcaster account for app association
- Image assets for your app (icon, feed preview, splash screen)

## Setup Steps

### 1. Environment Variables

Make sure your `.env.local` file has the public URL of your app:

```
NEXT_PUBLIC_URL=https://your-domain.com
```

During local development, you can use a service like Cloudflared or ngrok to expose your local server:

```bash
# Install Cloudflared
brew install cloudflared  # For macOS
# or download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/ for other platforms

# Run the tunnel
cloudflared tunnel --url http://localhost:3000
```

Use the provided URL in your .env.local file.

### 2. Image Assets

Replace the placeholder images in the `/public/images/` directory:

- `icon.png`: App icon (square, 200px × 200px recommended)
- `feed.png`: Preview image shown in feeds (3:2 ratio, 1200px × 800px recommended)
- `splash.png`: Splash screen image (square, 200px × 200px recommended)

### 3. Register Your App

1. Visit [Warpcast's Developer Tools](https://warpcast.com/~/developers/new)
2. Enter your app details and domain
3. Copy the generated credentials to the `farcaster.json` file in `src/app/.well-known/farcaster/route.ts`

Update the accountAssociation section with the values from Warpcast:

```typescript
accountAssociation: {
  "header": "YOUR_HEADER_FROM_WARPCAST",
  "payload": "YOUR_PAYLOAD_FROM_WARPCAST",
  "signature": "YOUR_SIGNATURE_FROM_WARPCAST"
},
```

### 4. Test Your Integration

To test your mini-app in Warpcast:

1. Deploy your app or expose your local server
2. Visit the [Warpcast Embed Tool](https://warpcast.com/~/developers/embeds)
3. Enter your app URL and click "Preview"

### 5. Publishing Your App

Once you're satisfied with your mini-app:

1. Ensure your app is deployed to its final domain
2. Make sure the `/.well-known/farcaster.json` endpoint works correctly
3. Your app should now be discoverable in Farcaster clients!

## Usage

Users can interact with your Monad Counter mini-app in Farcaster clients by:

1. Clicking the "Share on Farcaster" button to share their counter interaction
2. Using "Add to Farcaster" to save the app for quick access

## Additional Resources

- [Farcaster Mini App Documentation](https://miniapps.farcaster.xyz)
- [Monad Farcaster Mini App Guide](https://docs.monad.xyz/guides/farcaster-miniapp)
- [Monad Mini App Template](https://github.com/monad-developers/monad-miniapp-template) 