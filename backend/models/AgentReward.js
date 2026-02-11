import db from "../config/database.js";

const AgentReward = {
  async create(data) {
    const [id] = await db("agent_rewards").insert(data);
    return this.findById(id);
  },

  async findById(id) {
    return db("agent_rewards")
      .join("agents", "agent_rewards.agent_id", "agents.id")
      .select(
        "agent_rewards.*",
        "agents.name as agent_name",
        "agents.address as agent_address"
      )
      .where("agent_rewards.id", id)
      .first();
  },

  async findByAgentId(agentId, { limit = 100, offset = 0 } = {}) {
    return db("agent_rewards")
      .where({ agent_id: agentId })
      .orderBy("earned_at", "desc")
      .limit(limit)
      .offset(offset);
  },

  async findByStatus(status, { limit = 100, offset = 0 } = {}) {
    return db("agent_rewards")
      .join("agents", "agent_rewards.agent_id", "agents.id")
      .select(
        "agent_rewards.*",
        "agents.name as agent_name",
        "agents.address as agent_address",
        "agents.owner_address"
      )
      .where("agent_rewards.status", status)
      .orderBy("earned_at", "desc")
      .limit(limit)
      .offset(offset);
  },

  async findByOwner(ownerAddress, { limit = 100, offset = 0 } = {}) {
    return db("agent_rewards")
      .join("agents", "agent_rewards.agent_id", "agents.id")
      .select(
        "agent_rewards.*",
        "agents.name as agent_name",
        "agents.address as agent_address"
      )
      .where("agents.owner_address", ownerAddress)
      .orderBy("earned_at", "desc")
      .limit(limit)
      .offset(offset);
  },

  async updateStatus(id, status, transactionHash = null) {
    const updateData = { status };
    if (status === 'CLAIMED') {
      updateData.claimed_at = db.fn.now();
    }
    if (transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    await db("agent_rewards").where({ id }).update(updateData);
    return this.findById(id);
  },

  async getTotalRewardsByAgent(agentId) {
    const result = await db("agent_rewards")
      .where({ agent_id: agentId })
      .whereIn('status', ['PENDING', 'CLAIMED'])
      .sum('amount as total')
      .first();
    
    return result?.total || 0;
  },

  async getClaimableRewards(agentId) {
    return db("agent_rewards")
      .where({ agent_id: agentId, status: 'PENDING' })
      .sum('amount as total')
      .first()
      .then(result => result?.total || 0);
  },

  async claimRewards(agentId, rewardIds) {
    const claimedRewards = [];
    
    for (const rewardId of rewardIds) {
      const reward = await this.findById(rewardId);
      if (reward && reward.agent_id === agentId && reward.status === 'PENDING') {
        const claimedReward = await this.updateStatus(rewardId, 'CLAIMED');
        claimedRewards.push(claimedReward);
      }
    }
    
    return claimedRewards;
  }
};

export default AgentReward;