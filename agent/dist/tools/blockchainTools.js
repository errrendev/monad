"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionReceiptTool = exports.getBlockTool = exports.estimateGasTool = exports.getEnsNameTool = exports.readContractTool = exports.sendEthTool = exports.getGasPriceTool = exports.getTransactionTool = exports.getBlockNumberTool = exports.getBalanceTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const accounts_1 = require("viem/accounts");
// Setup Viem clients
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.sepolia, // or mainnet
    transport: (0, viem_1.http)(process.env.RPC_URL),
});
// Optional: Wallet client for transactions
const account = process.env.PRIVATE_KEY
    ? (0, accounts_1.privateKeyToAccount)(`0x${process.env.PRIVATE_KEY}`)
    : null;
const walletClient = account ? (0, viem_1.createWalletClient)({
    account,
    chain: chains_1.sepolia,
    transport: (0, viem_1.http)(process.env.RPC_URL),
}) : null;
// Tool 1: Get ETH Balance
exports.getBalanceTool = new tools_1.DynamicStructuredTool({
    name: "get_eth_balance",
    description: "Get the ETH balance of an Ethereum address. Returns balance in ETH.",
    schema: zod_1.z.object({
        address: zod_1.z.string().describe("The Ethereum address to check (0x...)"),
    }),
    func: async ({ address }) => {
        try {
            const balance = await publicClient.getBalance({
                address: address,
            });
            const balanceInEth = (0, viem_1.formatEther)(balance);
            return `Balance: ${balanceInEth} ETH`;
        }
        catch (error) {
            return `Error getting balance: ${error.message}`;
        }
    },
});
// Tool 2: Get Block Number
exports.getBlockNumberTool = new tools_1.DynamicStructuredTool({
    name: "get_block_number",
    description: "Get the current block number of the blockchain",
    schema: zod_1.z.object({}),
    func: async () => {
        try {
            const blockNumber = await publicClient.getBlockNumber();
            return `Current block number: ${blockNumber}`;
        }
        catch (error) {
            return `Error getting block number: ${error.message}`;
        }
    },
});
// Tool 3: Get Transaction Details
exports.getTransactionTool = new tools_1.DynamicStructuredTool({
    name: "get_transaction",
    description: "Get details of a transaction by its hash",
    schema: zod_1.z.object({
        hash: zod_1.z.string().describe("The transaction hash (0x...)"),
    }),
    func: async ({ hash }) => {
        try {
            const tx = await publicClient.getTransaction({
                hash: hash,
            });
            return JSON.stringify({
                from: tx.from,
                to: tx.to,
                value: (0, viem_1.formatEther)(tx.value),
                blockNumber: tx.blockNumber,
                gas: tx.gas.toString(),
            }, null, 2);
        }
        catch (error) {
            return `Error getting transaction: ${error.message}`;
        }
    },
});
// Tool 4: Get Gas Price
exports.getGasPriceTool = new tools_1.DynamicStructuredTool({
    name: "get_gas_price",
    description: "Get the current gas price in Gwei",
    schema: zod_1.z.object({}),
    func: async () => {
        try {
            const gasPrice = await publicClient.getGasPrice();
            const gasPriceInGwei = Number(gasPrice) / 1e9;
            return `Current gas price: ${gasPriceInGwei.toFixed(2)} Gwei`;
        }
        catch (error) {
            return `Error getting gas price: ${error.message}`;
        }
    },
});
// Tool 5: Send ETH (requires wallet)
exports.sendEthTool = new tools_1.DynamicStructuredTool({
    name: "send_eth",
    description: "Send ETH to an address. ONLY use when explicitly asked to send a transaction.",
    schema: zod_1.z.object({
        to: zod_1.z.string().describe("Recipient address (0x...)"),
        amount: zod_1.z.string().describe("Amount in ETH (e.g., '0.1')"),
    }),
    func: async ({ to, amount }) => {
        if (!walletClient || !account) {
            return "Wallet not configured. Please set PRIVATE_KEY in environment variables.";
        }
        try {
            const hash = await walletClient.sendTransaction({
                to: to,
                value: (0, viem_1.parseEther)(amount),
            });
            return `Transaction sent! Hash: ${hash}`;
        }
        catch (error) {
            return `Error sending transaction: ${error.message}`;
        }
    },
});
// Tool 6: Read from Smart Contract (ERC20 example)
exports.readContractTool = new tools_1.DynamicStructuredTool({
    name: "read_erc20_balance",
    description: "Read ERC20 token balance for an address",
    schema: zod_1.z.object({
        contractAddress: zod_1.z.string().describe("ERC20 token contract address"),
        walletAddress: zod_1.z.string().describe("Wallet address to check balance"),
    }),
    func: async ({ contractAddress, walletAddress }) => {
        try {
            const balance = await publicClient.readContract({
                address: contractAddress,
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
                args: [walletAddress],
            });
            return `Token balance: ${balance}`;
        }
        catch (error) {
            return `Error reading contract: ${error.message}`;
        }
    },
});
// Tool 7: Get ENS Name
exports.getEnsNameTool = new tools_1.DynamicStructuredTool({
    name: "get_ens_name",
    description: "Get ENS name for an Ethereum address",
    schema: zod_1.z.object({
        address: zod_1.z.string().describe("Ethereum address (0x...)"),
    }),
    func: async ({ address }) => {
        try {
            const ensName = await publicClient.getEnsName({
                address: address,
            });
            return ensName ? `ENS name: ${ensName}` : "No ENS name found for this address";
        }
        catch (error) {
            return `Error getting ENS name: ${error.message}`;
        }
    },
});
// Tool 8: Estimate Gas
exports.estimateGasTool = new tools_1.DynamicStructuredTool({
    name: "estimate_gas",
    description: "Estimate gas needed for a transaction",
    schema: zod_1.z.object({
        to: zod_1.z.string().describe("Recipient address (0x...)"),
        value: zod_1.z.string().describe("Amount in ETH (e.g., '0.1')"),
    }),
    func: async ({ to, value }) => {
        try {
            const gas = await publicClient.estimateGas({
                to: to,
                value: (0, viem_1.parseEther)(value),
            });
            return `Estimated gas: ${gas.toString()} units`;
        }
        catch (error) {
            return `Error estimating gas: ${error.message}`;
        }
    },
});
// Tool 9: Get Block Details
exports.getBlockTool = new tools_1.DynamicStructuredTool({
    name: "get_block_details",
    description: "Get detailed information about a specific block",
    schema: zod_1.z.object({
        blockNumber: zod_1.z.string().describe("Block number to query"),
    }),
    func: async ({ blockNumber }) => {
        try {
            const block = await publicClient.getBlock({
                blockNumber: BigInt(blockNumber),
            });
            return JSON.stringify({
                number: block.number,
                hash: block.hash,
                timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
                transactions: block.transactions.length,
                gasUsed: block.gasUsed.toString(),
                gasLimit: block.gasLimit.toString(),
            }, null, 2);
        }
        catch (error) {
            return `Error getting block details: ${error.message}`;
        }
    },
});
// Tool 10: Get Transaction Receipt
exports.getTransactionReceiptTool = new tools_1.DynamicStructuredTool({
    name: "get_transaction_receipt",
    description: "Get the receipt of a transaction to check if it was successful",
    schema: zod_1.z.object({
        hash: zod_1.z.string().describe("Transaction hash (0x...)"),
    }),
    func: async ({ hash }) => {
        try {
            const receipt = await publicClient.getTransactionReceipt({
                hash: hash,
            });
            return JSON.stringify({
                status: receipt.status === "success" ? "Success" : "Failed",
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                from: receipt.from,
                to: receipt.to,
            }, null, 2);
        }
        catch (error) {
            return `Error getting transaction receipt: ${error.message}`;
        }
    },
});
