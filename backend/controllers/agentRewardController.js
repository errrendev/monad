import AgentReward from "../models/AgentReward.js";
import Agent from "../models/Agent.js";

const agentRewardController = {
  async createReward(req, res) {
    try {
      const { agentId, gameId, amount, currency = 'POINTS', metadata } = req.body;

      if (!agentId || !gameId || !amount) {
        return res.status(400).json({
          success: false,
          message: "Agent ID, Game ID, and amount are required"
        });
      }

      const reward = await AgentReward.create({
        agent_id: agentId,
        game_id: gameId,
        amount,
        currency,
        metadata: metadata ? JSON.stringify(metadata) : null
      });

      res.status(201).json({
        success: true,
        message: "Reward created successfully",
        data: reward
      });
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getRewardsByAgent(req, res) {
    try {
      const { agentId } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      const rewards = await AgentReward.findByAgentId(agentId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        message: "successful",
        data: rewards
      });
    } catch (error) {
      console.error("Error fetching agent rewards:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getRewardsByOwner(req, res) {
    try {
      const { ownerAddress } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      const rewards = await AgentReward.findByOwner(ownerAddress, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        message: "successful",
        data: rewards
      });
    } catch (error) {
      console.error("Error fetching owner rewards:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getRewardsByStatus(req, res) {
    try {
      const { status } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      const validStatuses = ['PENDING', 'CLAIMED', 'EXPIRED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be PENDING, CLAIMED, or EXPIRED"
        });
      }

      const rewards = await AgentReward.findByStatus(status, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        message: "successful",
        data: rewards
      });
    } catch (error) {
      console.error("Error fetching rewards by status:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async claimRewards(req, res) {
    try {
      const { ownerAddress } = req.body;
      const { rewardIds } = req.body;

      if (!ownerAddress || !rewardIds || !Array.isArray(rewardIds)) {
        return res.status(400).json({
          success: false,
          message: "Owner address and reward IDs array are required"
        });
      }

      // Verify that the owner owns these agents
      const agents = await Agent.findByOwner(ownerAddress);
      const agentIds = agents.map(agent => agent.id);

      // Get rewards that belong to owner's agents and are pending
      const rewards = await AgentReward.findByStatus('PENDING');
      const claimableRewards = rewards.filter(reward => 
        agentIds.includes(reward.agent_id) && rewardIds.includes(reward.id)
      );

      if (claimableRewards.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No claimable rewards found"
        });
      }

      // Claim the rewards
      const claimedRewardIds = claimableRewards.map(r => r.id);
      const claimedRewards = [];

      for (const rewardId of claimedRewardIds) {
        const claimedReward = await AgentReward.updateStatus(rewardId, 'CLAIMED');
        if (claimedReward) {
          claimedRewards.push(claimedReward);
        }
      }

      res.json({
        success: true,
        message: "Rewards claimed successfully",
        data: {
          claimedCount: claimedRewards.length,
          totalAmount: claimedRewards.reduce((sum, r) => sum + parseFloat(r.amount), 0),
          rewards: claimedRewards
        }
      });
    } catch (error) {
      console.error("Error claiming rewards:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getClaimableRewards(req, res) {
    try {
      const { ownerAddress } = req.params;

      const agents = await Agent.findByOwner(ownerAddress);
      const agentIds = agents.map(agent => agent.id);

      const pendingRewards = await AgentReward.findByStatus('PENDING');
      const claimableRewards = pendingRewards.filter(reward => 
        agentIds.includes(reward.agent_id)
      );

      const totalClaimable = claimableRewards.reduce((sum, r) => sum + parseFloat(r.amount), 0);

      res.json({
        success: true,
        message: "successful",
        data: {
          rewards: claimableRewards,
          totalAmount: totalClaimable,
          count: claimableRewards.length
        }
      });
    } catch (error) {
      console.error("Error fetching claimable rewards:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default agentRewardController;