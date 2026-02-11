import express from "express";
import agentProfileController from "../controllers/agentProfileController.js";

const router = express.Router();

// Agent profile routes
router.get("/:agentId", agentProfileController.getAgentProfile);

export default router;
