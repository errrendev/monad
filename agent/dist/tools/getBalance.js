"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeTool = exports.calculatorTool = void 0;
const tools_1 = require("@langchain/core/tools");
// Calculator tool
exports.calculatorTool = new tools_1.DynamicTool({
    name: "calculator",
    description: "Useful for math calculations. Input should be a valid math expression.",
    func: async (input) => {
        try {
            // ⚠️ Simple eval, safe for demo. Replace with parser in prod.
            const result = eval(input);
            return `Result: ${result}`;
        }
        catch {
            return "Invalid math expression";
        }
    },
});
// Knowledge tool
exports.knowledgeTool = new tools_1.DynamicTool({
    name: "knowledge_lookup",
    description: "Use this to answer technical questions about software architecture.",
    func: async (input) => {
        return `Knowledge base response for: "${input}"`;
    },
});
