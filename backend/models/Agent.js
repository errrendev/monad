import db from "../config/database.js";

const Agent = {
  async create(data) {
    const [id] = await db("agents").insert(data);
    return this.findById(id);
  },

  async findById(id) {
    return db("agents").where({ id }).first();
  },

  async findByAddress(address, chain = 'AI_NET') {
    return db("agents").where({ address, chain }).first();
  },

  async findByOwner(ownerAddress) {
    return db("agents").where({ owner_address: ownerAddress }).where('is_active', true);
  },

  async findAll({ limit = 100, offset = 0, sortBy = 'total_revenue', order = 'desc' } = {}) {
    return db("agents")
      .where('is_active', true)
      .orderBy(sortBy, order)
      .limit(limit)
      .offset(offset);
  },

  async update(id, data) {
    await db("agents").where({ id }).update({ ...data, updated_at: db.fn.now() });
    return this.findById(id);
  },

  async updateStats(agentId, { wins = 0, matches = 0, revenue = 0 }) {
    const agent = await this.findById(agentId);
    if (!agent) return null;

    const newWins = agent.total_wins + wins;
    const newMatches = agent.total_matches + matches;
    const newRevenue = parseFloat(agent.total_revenue) + revenue;
    const winRate = newMatches > 0 ? (newWins / newMatches) * 100 : 0;

    return this.update(agentId, {
      total_wins: newWins,
      total_matches: newMatches,
      total_revenue: newRevenue,
      win_rate: winRate,
      current_streak: wins > 0 ? agent.current_streak + 1 : 0
    });
  },

  async delete(id) {
    return db("agents").where({ id }).del();
  },

  // Leaderboard queries
  async getLeaderboard({ limit = 50, offset = 0, metric = 'total_revenue' } = {}) {
    const validMetrics = ['total_revenue', 'total_wins', 'win_rate', 'current_streak'];
    const sortBy = validMetrics.includes(metric) ? metric : 'total_revenue';

    try {
      let query = db("agents")
        .where('is_active', true);
        // Removed: .where('total_matches', '>', 0) to show all agents

      // Handle win_rate calculation if it's null or needs updating
      if (sortBy === 'win_rate') {
        query = query.select([
          '*',
          db.raw('CASE WHEN total_matches > 0 THEN ROUND((total_wins * 100.0 / total_matches), 2) ELSE 0 END as calculated_win_rate')
        ]).orderBy('calculated_win_rate', 'desc');
      } else {
        query = query.orderBy(sortBy, 'desc');
      }

      const results = await query
        .limit(limit)
        .offset(offset);

      // Ensure win_rate is always a number
      return results.map(agent => ({
        ...agent,
        win_rate: parseFloat(agent.win_rate) || 0,
        calculated_win_rate: parseFloat(agent.calculated_win_rate) || agent.win_rate || 0
      }));
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      // Fallback query
      const fallbackResults = await db("agents")
        .where('is_active', true)
        .orderBy('total_revenue', 'desc')
        .limit(limit)
        .offset(offset);

      // Ensure win_rate is always a number in fallback
      return fallbackResults.map(agent => ({
        ...agent,
        win_rate: parseFloat(agent.win_rate) || 0
      }));
    }
  },

  async getTopAgentsByMetric(metric, limit = 10) {
    return this.getLeaderboard({ limit, metric });
  },

  // Update win rates for all agents to ensure data consistency
  async updateAllWinRates() {
    try {
      const agents = await db('agents').where('total_matches', '>', 0);
      
      for (const agent of agents) {
        const winRate = agent.total_matches > 0 ? 
          Math.round((agent.total_wins / agent.total_matches) * 100 * 100) / 100 : 0;
        
        await db('agents')
          .where('id', agent.id)
          .update({ 
            win_rate: winRate,
            updated_at: db.fn.now()
          });
      }
      
      console.log(`Updated win rates for ${agents.length} agents`);
      return true;
    } catch (error) {
      console.error('Error updating win rates:', error);
      return false;
    }
  }
};

export default Agent;