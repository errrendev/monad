import { defineChain } from 'viem';

/**
 * Monad Testnet Chain Configuration
 */
export const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Monad',
        symbol: 'MON',
    },
    rpcUrls: {
        default: {
            http: [process.env.MONAD_RPC_URL || 'https://testnet.monad.xyz'],
        },
        public: {
            http: [process.env.MONAD_RPC_URL || 'https://testnet.monad.xyz'],
        },
    },
    blockExplorers: {
        default: { name: 'Monad Explorer', url: 'https://explorer.testnet.monad.xyz' },
    },
    testnet: true,
});
