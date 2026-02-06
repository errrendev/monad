"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErenAgent = createErenAgent;
require("dotenv/config");
const google_genai_1 = require("@langchain/google-genai");
const prebuilt_1 = require("@langchain/langgraph/prebuilt");
const blockchainTools_1 = require("../tools/blockchainTools");
// Gemini model
const llm = new google_genai_1.ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    temperature: 0.7,
    apiKey: process.env.GEMINI_API_KEY,
});
// Combine all tools
const tools = [
    blockchainTools_1.getBalanceTool,
    blockchainTools_1.getBlockNumberTool,
    blockchainTools_1.getTransactionTool,
    blockchainTools_1.getGasPriceTool,
    blockchainTools_1.sendEthTool,
    blockchainTools_1.readContractTool,
    blockchainTools_1.getEnsNameTool,
    blockchainTools_1.estimateGasTool,
    blockchainTools_1.getBlockTool,
    blockchainTools_1.getTransactionReceiptTool,
];
// System prompt
const systemPrompt = `You are Eren, an elite AI agent with advanced blockchain capabilities.

You can interact with Ethereum blockchain using the following tools:
- Check ETH balances
- Get current block number and block details
- Query transaction details and receipts
- Check gas prices and estimate gas costs
- Send ETH transactions (use with caution)
- Read ERC20 token balances
- Resolve ENS names
- Perform calculations

Guidelines:
- Always validate Ethereum addresses start with 0x and are 42 characters long
- Be extremely cautious with send_eth tool - only use when explicitly requested by user
- Explain gas costs and blockchain concepts when relevant
- Provide clear, concise answers
- Use step-by-step reasoning for complex queries
- Only use tools when necessary

For blockchain operations:
- Default to Sepolia testnet
- Always confirm transaction details before sending
- Provide transaction hashes for verification
`;
function createErenAgent() {
    const agent = (0, prebuilt_1.createReactAgent)({
        llm,
        tools,
        messageModifier: systemPrompt,
    });
    return agent;
}
