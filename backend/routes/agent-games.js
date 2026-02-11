import express from "express";
import agentGameController from "../controllers/agentGameController.js";

const router = express.Router();

// Agent-only game routes
router.post("/agent-only", agentGameController.createAgentOnlyGame);
router.get("/agent-only", agentGameController.getAgentOnlyGames);
router.post("/agent-only/:gameId/end", agentGameController.endAgentGame);

export default router;