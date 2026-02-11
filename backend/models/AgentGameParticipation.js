import db from "../config/database.js";

const AgentGameParticipation = {
  async create(data) {
    const [id] = await db("agent_game_participations").insert(data);
    return this.findById(id);
  },

  async findById(id) {
    return db("agent_game_participations")
      .join("agents", "agent_game_participations.agent_id", "agents.id")
      .join("games", "agent_game_participations.game_id", "games.id")
      .select(
        "agent_game_participations.*",
        "agents.name as agent_name",
        "agents.address as agent_address",
        "games.code as game_code",
        "games.status as game_status"
      )
      .where("agent_game_participations.id", id)
      .first();
  },

  async findByAgentId(agentId, { limit = 100, offset = 0 } = {}) {
    return db("agent_game_participations")
      .join("games", "agent_game_participations.game_id", "games.id")
      .select(
        "agent_game_participations.*",
        "games.code as game_code",
        "games.status as game_status",
        "games.created_at as game_created_at"
      )
      .where("agent_game_participations.agent_id", agentId)
      .orderBy("joined_at", "desc")
      .limit(limit)
      .offset(offset);
  },

  async findByGameId(gameId) {
    return db("agent_game_participations")
      .join("agents", "agent_game_participations.agent_id", "agents.id")
      .select(
        "agent_game_participations.*",
        "agents.name as agent_name",
        "agents.address as agent_address",
        "agents.strategy as agent_strategy"
      )
      .where("agent_game_participations.game_id", gameId)
      .orderBy("rank", "asc");
  },

  async updateGameResult(agentId, gameId, resultData) {
    const participation = await db("agent_game_participations")
      .where({ agent_id: agentId, game_id: gameId })
      .first();

    if (!participation) return null;

    return db("agent_game_participations")
      .where({ id: participation.id })
      .update({
        ...resultData,
        finished_at: db.fn.now()
      })
      .then(() => this.findById(participation.id));
  },

  async getAgentStats(agentId) {
    const stats = await db("agent_game_participations")
      .where({ agent_id: agentId })
      .whereNotNull('finished_at')
      .select(
        db.raw('COUNT(*) as total_games'),
        db.raw('SUM(CASE WHEN won = true THEN 1 ELSE 0 END) as wins'),
        db.raw('AVG(final_balance) as avg_final_balance'),
        db.raw('AVG(properties_owned) as avg_properties_owned'),
        db.raw('AVG(rank) as avg_rank')
      )
      .first();

    return {
      totalGames: parseInt(stats.total_games) || 0,
      wins: parseInt(stats.wins) || 0,
      winRate: stats.total_games > 0 ? (parseInt(stats.wins) / parseInt(stats.total_games)) * 100 : 0,
      avgFinalBalance: parseFloat(stats.avg_final_balance) || 0,
      avgPropertiesOwned: parseFloat(stats.avg_properties_owned) || 0,
      avgRank: parseFloat(stats.avg_rank) || 0
    };
  },

  async getTopPerformers(limit = 10) {
    return db("agent_game_participations")
      .join("agents", "agent_game_participations.agent_id", "agents.id")
      .select(
        "agents.id",
        "agents.name",
        "agents.address",
        "agents.strategy",
        db.raw('COUNT(*) as games_played'),
        db.raw('SUM(CASE WHEN won = true THEN 1 ELSE 0 END) as wins'),
        db.raw('AVG(final_balance) as avg_final_balance'),
        db.raw('AVG(rank) as avg_rank')
      )
      .whereNotNull('finished_at')
      .groupBy('agents.id', 'agents.name', 'agents.address', 'agents.strategy')
      .orderBy('wins', 'desc')
      .limit(limit);
  }
};

export default AgentGameParticipation;