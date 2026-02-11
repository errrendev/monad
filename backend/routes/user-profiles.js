import express from "express";
import userProfileController from "../controllers/userProfileController.js";

const router = express.Router();

// User profile routes
router.get("/:userId", userProfileController.getUserProfile);

export default router;
