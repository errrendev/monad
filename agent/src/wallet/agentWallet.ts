import { createPublicClient, createWalletClient, http, type Address, type PrivateKeyAccount } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "../config/chains.js";

/**
 * Agent Wallet Manager
 * Handles wallet creation, transaction signing, and on-chain interactions for AI agents
 */
export class AgentWallet {
    private account: PrivateKeyAccount;
    private publicClient;
    private walletClient;
    public address: Address;

    constructor(privateKey: `0x${string}`) {
        this.account = privateKeyToAccount(privateKey);
        this.address = this.account.address;

        this.publicClient = createPublicClient({
            chain: monadTestnet,
            transport: http(),
        });

        this.walletClient = createWalletClient({
            account: this.account,
            chain: monadTestnet,
            transport: http(),
        });
    }

    /**
     * Generate a new random wallet
     */
    static generateWallet(): { privateKey: `0x${string}`; address: Address } {
        const account = privateKeyToAccount(
            `0x${Array.from({ length: 64 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('')}` as `0x${string}`
        );

        return {
            privateKey: account.address as `0x${string}`, // This should be the private key
            address: account.address,
        };
    }

    /**
     * Get ETH balance
     */
    async getBalance(): Promise<bigint> {
        return await this.publicClient.getBalance({ address: this.address });
    }

    /**
     * Get ERC20 token balance
     */
    async getTokenBalance(tokenAddress: Address): Promise<bigint> {
        const balance = await this.publicClient.readContract({
            address: tokenAddress,
            abi: [
                {
                    name: "balanceOf",
                    type: "function",
                    stateMutability: "view",
                    inputs: [{ name: "account", type: "address" }],
                    outputs: [{ type: "uint256" }],
                },
            ],
            functionName: "balanceOf",
            args: [this.address],
        });

        return balance as bigint;
    }

    /**
     * Register agent on-chain (calls Tycoon.registerPlayer)
     */
    async registerOnChain(
        username: string,
        tycoonContractAddress: Address,
        tycoonAbi: any[]
    ): Promise<`0x${string}`> {
        const hash = await this.walletClient.writeContract({
            address: tycoonContractAddress,
            abi: tycoonAbi,
            functionName: "registerPlayer",
            args: [username],
        });

        // Wait for transaction confirmation
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        return hash;
    }

    /**
     * Approve token spending (for stakes)
     */
    async approveToken(
        tokenAddress: Address,
        spenderAddress: Address,
        amount: bigint
    ): Promise<`0x${string}`> {
        const hash = await this.walletClient.writeContract({
            address: tokenAddress,
            abi: [
                {
                    name: "approve",
                    type: "function",
                    stateMutability: "nonpayable",
                    inputs: [
                        { name: "spender", type: "address" },
                        { name: "amount", type: "uint256" },
                    ],
                    outputs: [{ type: "bool" }],
                },
            ],
            functionName: "approve",
            args: [spenderAddress, amount],
        });

        await this.publicClient.waitForTransactionReceipt({ hash });
        return hash;
    }

    /**
     * Create a game on-chain
     */
    async createGame(
        tycoonContractAddress: Address,
        tycoonAbi: any[],
        params: {
            username: string;
            gameType: string;
            playerSymbol: string;
            numberOfPlayers: number;
            code: string;
            startingBalance: bigint;
            stakeAmount: bigint;
        }
    ): Promise<`0x${string}`> {
        const hash = await this.walletClient.writeContract({
            address: tycoonContractAddress,
            abi: tycoonAbi,
            functionName: "createGame",
            args: [
                params.username,
                params.gameType,
                params.playerSymbol,
                params.numberOfPlayers,
                params.code,
                params.startingBalance,
                params.stakeAmount,
            ],
        });

        await this.publicClient.waitForTransactionReceipt({ hash });
        return hash;
    }

    /**
     * Join a game on-chain
     */
    async joinGame(
        tycoonContractAddress: Address,
        tycoonAbi: any[],
        gameId: number,
        username: string,
        playerSymbol: string,
        joinCode: string
    ): Promise<`0x${string}`> {
        const hash = await this.walletClient.writeContract({
            address: tycoonContractAddress,
            abi: tycoonAbi,
            functionName: "joinGame",
            args: [gameId, username, playerSymbol, joinCode],
        });

        await this.publicClient.waitForTransactionReceipt({ hash });
        return hash;
    }

    /**
     * Send ETH to another address
     */
    async sendEth(to: Address, amount: bigint): Promise<`0x${string}`> {
        const hash = await this.walletClient.sendTransaction({
            to,
            value: amount,
        });

        await this.publicClient.waitForTransactionReceipt({ hash });
        return hash;
    }

    /**
     * Estimate gas for a transaction
     */
    async estimateGas(params: {
        to: Address;
        data?: `0x${string}`;
        value?: bigint;
    }): Promise<bigint> {
        return await this.publicClient.estimateGas({
            account: this.account,
            ...params,
        });
    }
}

/**
 * Generate a new random wallet for an agent
 */
export function generateAgentWallet(): { privateKey: `0x${string}`; address: Address } {
    return AgentWallet.generateWallet();
}
