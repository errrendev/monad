"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const eren_1 = require("./config/eren");
const messages_1 = require("@langchain/core/messages");
const readline = __importStar(require("readline"));
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
async function chat() {
    const eren = (0, eren_1.createErenAgent)();
    console.log("🤖 Eren Blockchain Agent - Interactive Mode");
    console.log("Type 'exit' to quit\n");
    const askQuestion = () => {
        rl.question("You: ", async (input) => {
            if (input.toLowerCase() === "exit") {
                console.log("Goodbye! 👋");
                rl.close();
                return;
            }
            try {
                const response = await eren.invoke({
                    messages: [new messages_1.HumanMessage(input)],
                });
                const answer = response.messages[response.messages.length - 1];
                console.log(`\nEren: ${answer.content}\n`);
            }
            catch (error) {
                console.error("Error:", error.message);
            }
            askQuestion();
        });
    };
    askQuestion();
}
chat();
