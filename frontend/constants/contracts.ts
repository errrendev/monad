// constants/contracts.ts
import { Address } from 'viem';

// Monad Testnet Chain ID
const MONAD_TESTNET_CHAIN_ID = 10143;

export const TYCOON_CONTRACT_ADDRESSES: Record<number, Address | undefined> = {
  [MONAD_TESTNET_CHAIN_ID]: process.env.NEXT_PUBLIC_MONAD_TESTNET as Address,
};

export const REWARD_CONTRACT_ADDRESSES: Record<number, Address | undefined> = {
  [MONAD_TESTNET_CHAIN_ID]: process.env.NEXT_PUBLIC_MONAD_REWARD as Address,
}

export const TYC_TOKEN_ADDRESS: Record<number, Address | undefined> = {
  [MONAD_TESTNET_CHAIN_ID]: process.env.NEXT_PUBLIC_MONAD_TYC as Address,
}

export const USDC_TOKEN_ADDRESS: Record<number, Address | undefined> = {
  [MONAD_TESTNET_CHAIN_ID]: process.env.NEXT_PUBLIC_MONAD_USDC as Address,
}

// Monad Testnet Chain IDs
export const MONAD_CHAIN_IDS = [MONAD_TESTNET_CHAIN_ID];