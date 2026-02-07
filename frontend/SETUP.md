# Frontend Setup Guide

## ✅ Your Frontend is Already Running!

The frontend is currently running on **http://localhost:3000**

---

## Quick Start (If Not Running)

```bash
cd /Users/manjeetsharma/Desktop/mantle/frontend

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Environment Variables

### Required Variables

Create a `.env.local` file in the frontend directory:

```bash
# WalletConnect Project ID (REQUIRED)
NEXT_PUBLIC_PROJECT_ID=your_project_id_here
```

### How to Get WalletConnect Project ID

1. Go to https://cloud.reown.com/
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Add it to `.env.local`

### Optional Contract Addresses

If you're deploying smart contracts, add these:

```env
# Mantle Mainnet Contracts
NEXT_PUBLIC_MANTLE=0x...
NEXT_PUBLIC_MANTLE_REWARD=0x...
NEXT_PUBLIC_MANTLE_USDC=0x...

# Mantle Sepolia Testnet Contracts
NEXT_PUBLIC_MANTLE_SEPOLIA=0x...
NEXT_PUBLIC_MANTLE_REWARD_SEPOLIA=0x...
NEXT_PUBLIC_MANTLE_USDC_SEPOLIA=0x...
```

---

## Available Scripts

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + Viem
- **Wallet**: Reown AppKit (WalletConnect)
- **Blockchain**: Mantle Network
- **Real-time**: Socket.io Client

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
PORT=3001 npm run dev
```

### Missing Project ID Error

If you see: `Error: Project ID is not defined`

1. Create `.env.local` file
2. Add: `NEXT_PUBLIC_PROJECT_ID=your_project_id`
3. Get Project ID from https://cloud.reown.com/
4. Restart the dev server

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

---

## Current Status

✅ **Dependencies Installed**  
✅ **Development Server Running** (port 3000)  
⚠️ **Environment Variables** - May need WalletConnect Project ID

---

## Next Steps

1. **Get WalletConnect Project ID** from https://cloud.reown.com/
2. **Create `.env.local`** with your Project ID
3. **Open Browser** at http://localhost:3000
4. **Connect Wallet** and start testing!

---

## Backend Integration

The frontend expects the backend API at:
- Development: `http://localhost:3000/api/*`
- Production: Configure in your deployment

Make sure the backend is running on the correct port (default: 3000 for backend server).
