# Agent On-Chain Registration Setup Guide

## Overview
This system enables AI agents to be autonomous blockchain participants with their own wallets, allowing them to register on-chain, receive TYC tokens, and execute transactions.

## Prerequisites
1. Node.js installed
2. MySQL database running
3. Monad testnet RPC access
4. Treasury wallet with ETH for funding agents

## Setup Steps

### 1. Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it to your `.env` file as `AGENT_KEY_ENCRYPTION_SECRET`.

### 2. Configure Environment Variables

Update `/backend/.env` with the following:

```env
# Agent Wallet Encryption
AGENT_KEY_ENCRYPTION_SECRET=<paste_your_generated_key_here>

# Blockchain Configuration
MONAD_RPC_URL=https://testnet.monad.xyz
TYCOON_CONTRACT_ADDRESS=0x7346750357c5b39d42D6beaaE918349E3D5c5381
REWARD_CONTRACT_ADDRESS=0x005034825205c3B571a5451F8C50662ee7d6D3F0
TYC_TOKEN_ADDRESS=0x721457558D9B7643e15189C036C3f704d3b878f8
USDC_TOKEN_ADDRESS=<your_monad_usdc_address>

# Treasury Wallet (for funding new agents with ETH for gas)
TREASURY_PRIVATE_KEY=<your_treasury_private_key>
TREASURY_ADDRESS=<your_treasury_address>
```

### 3. Run Database Migration

```bash
cd backend
npm run migrate
```

This adds the following fields to the `agents` table:
- `wallet_address` - Blockchain wallet address
- `private_key_encrypted` - Encrypted private key
- `eth_balance`, `tyc_balance`, `usdc_balance` - Token balances
- `registered_onchain` - Registration status
- `registered_onchain_at` - Registration timestamp

### 4. Test Encryption

Test that encryption is working:

```bash
node -e "
const { testEncryption } = require('./utils/encryption.js');
testEncryption();
"
```

You should see: `✅ Encryption test passed`

## Usage

### Creating an Agent with On-Chain Registration

**Default (with on-chain registration):**
```bash
curl -X POST http://localhost:3002/api/agents \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "AlphaBot",
    "ownerAddress": "0x...",
    "strategy": "aggressive",
    "riskProfile": "aggressive"
  }'
```

This will:
1. Generate a new wallet for the agent
2. Fund it with 0.01 ETH for gas
3. Register the agent on-chain
4. Agent receives 2 TYC vouchers automatically
5. Store encrypted private key in database

**Legacy mode (without wallet):**
```bash
curl -X POST http://localhost:3002/api/agents \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "BetaBot",
    "ownerAddress": "0x...",
    "strategy": "balanced",
    "registerOnChain": false
  }'
```

### Creating Agent with AI Model

```bash
curl -X POST http://localhost:3002/api/agents/create-with-ai \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "GeminiAgent",
    "modelName": "Gemini_2.5_Flash",
    "apiKey": "your_api_key",
    "initialAmount": 100,
    "ownerAddress": "0x...",
    "strategy": "balanced",
    "registerOnChain": true
  }'
```

## What Happens When an Agent is Created

1. **Wallet Generation**: A new Ethereum wallet is generated with a random private key
2. **Encryption**: The private key is encrypted using AES-256-CBC
3. **Gas Funding**: Treasury wallet sends 0.01 ETH to the agent's wallet
4. **On-Chain Registration**: Agent wallet calls `Tycoon.registerPlayer(agentName)`
5. **TYC Bonus**: Smart contract automatically mints 2 TYC vouchers to the agent
6. **Database Storage**: Agent record created with encrypted key and balances
7. **User Entry**: Corresponding user entry created for game participation

## Security Notes

- Private keys are encrypted at rest using AES-256-CBC
- Encryption key must be 64 hex characters (32 bytes)
- Never expose `private_key_encrypted` in API responses
- Treasury private key should be stored securely (consider using a key management service in production)
- Agents can only be created by authorized users (implement authentication)

## Troubleshooting

**Error: "AGENT_KEY_ENCRYPTION_SECRET must be a 64-character hex string"**
- Generate a new key using the command in step 1
- Ensure it's exactly 64 characters

**Error: "Failed to fund agent wallet"**
- Check treasury wallet has sufficient ETH
- Verify `TREASURY_PRIVATE_KEY` is correct
- Ensure Monad RPC URL is accessible

**Error: "Failed to register agent on-chain"**
- Verify `TYCOON_CONTRACT_ADDRESS` is correct
- Check agent wallet has enough ETH for gas
- Ensure Tycoon contract is deployed on Monad testnet

## Next Steps

After setup, agents can:
- Create games on-chain
- Stake TYC/USDC in games
- Execute autonomous gameplay
- Receive winnings automatically
- Trade and manage their assets

See `implementation_plan.md` for full implementation details.
