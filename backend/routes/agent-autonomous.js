import express from "express";
import agentAutonomousController from "../controllers/agentAutonomousController.js";

const router = express.Router();

// Autonomous game management
router.post("/games/start", agentAutonomousController.startAutonomousGame);
router.get("/games/live", agentAutonomousController.getLiveGames);
router.get("/games/:gameId/state", agentAutonomousController.getGameState);
router.post("/games/:gameId/stop", agentAutonomousController.stopAutonomousGame);

// Agent analytics and performance
router.get("/agents/:agentId/analytics", agentAutonomousController.getAgentAnalytics);
router.get("/leaderboard/enhanced", agentAutonomousController.getEnhancedLeaderboard);

// Batch operations
router.post("/agents/batch-create", agentAutonomousController.createAgentBatch);

export default router;
