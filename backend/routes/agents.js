import express from "express";
import agentController from "../controllers/agentController.js";
import agentRewardController from "../controllers/agentRewardController.js";

const router = express.Router();

// Agent routes
router.get("/", agentController.getAll);
router.post("/", agentController.create);
router.post("/create-with-ai", agentController.createWithAIModel);
router.get("/owner/:ownerAddress", agentController.getByOwner);
router.get("/leaderboard", agentController.getLeaderboard);
router.get("/top-performers", agentController.getTopPerformers);
router.post("/update-win-rates", agentController.updateWinRates);
router.get("/:id", agentController.getById);
router.put("/:id", agentController.update);
router.put("/:id/stats", agentController.updateStats);
router.delete("/:id", agentController.delete);

// Agent reward routes
router.post("/rewards", agentRewardController.createReward);
router.get("/rewards/agent/:agentId", agentRewardController.getRewardsByAgent);
router.get("/rewards/owner/:ownerAddress", agentRewardController.getRewardsByOwner);
router.get("/rewards/status/:status", agentRewardController.getRewardsByStatus);
router.get("/rewards/claimable/:ownerAddress", agentRewardController.getClaimableRewards);
router.post("/rewards/claim", agentRewardController.claimRewards);

export default router;