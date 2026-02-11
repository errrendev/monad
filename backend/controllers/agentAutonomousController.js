import AgentGameRunner from "../services/agentGameRunner.js";
import Agent from "../models/Agent.js";
import AgentGameParticipation from "../models/AgentGameParticipation.js";
import Game from "../models/Game.js";

const agentAutonomousController = {
  // Start autonomous agent-only game
  async startAutonomousGame(req, res) {
    try {
      const { agentIds, settings = {}, ownerAddress } = req.body;

      if (!agentIds || !Array.isArray(agentIds) || agentIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: "At least 2 agent IDs required"
        });
      }

      // Verify owner owns all agents
      const ownerAgents = await Agent.findByOwner(ownerAddress);
      const ownerAgentIds = ownerAgents.map(agent => agent.id);
      const hasPermission = agentIds.every(id => ownerAgentIds.includes(id));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You don't own all the specified agents"
        });
      }

      // Create game using existing agentGameController
      const gameCode = `AUTO_${Date.now()}`;
      const gameSettings = {
        auction: settings.auction ?? false,
        rent_in_prison: settings.rent_in_prison ?? true,
        mortgage: settings.mortgage ?? true,
        even_build: settings.even_build ?? false,
        randomize_play_order: settings.randomize_play_order ?? true,
        starting_cash: settings.starting_cash ?? 1500
      };

      // Import and use agentGameController
      const { createAgentOnlyGame } = await import('./agentGameController.js');
      const gameResponse = await createAgentOnlyGame({
        body: {
          code: gameCode,
          mode: 'agent-only',
          numberOfPlayers: agentIds.length,
          settings: gameSettings,
          agentIds,
          ownerAddress
        }
      }, {
        status: () => ({ json: (data) => data }),
        json: (data) => data
      });

      if (!gameResponse.success) {
        return res.status(400).json(gameResponse);
      }

      // Start autonomous execution
      await AgentGameRunner.startAgentGame(gameResponse.data.id);

      res.status(201).json({
        success: true,
        message: "Autonomous agent game started successfully",
        data: {
          ...gameResponse.data,
          autonomous_mode: true,
          execution_interval: 3000 // 3 seconds per turn
        }
      });
    } catch (error) {
      console.error("Error starting autonomous game:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get live autonomous games
  async getLiveGames(req, res) {
    try {
      const liveGames = AgentGameRunner.getLiveGames();

      res.json({
        success: true,
        message: "successful",
        data: liveGames
      });
    } catch (error) {
      console.error("Error fetching live games:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get specific game state
  async getGameState(req, res) {
    try {
      const { gameId } = req.params;
      
      const gameState = AgentGameRunner.getGameState(parseInt(gameId));
      
      if (!gameState) {
        return res.status(404).json({
          success: false,
          message: "Game not found or not active"
        });
      }

      res.json({
        success: true,
        message: "successful",
        data: gameState
      });
    } catch (error) {
      console.error("Error fetching game state:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Stop autonomous game
  async stopAutonomousGame(req, res) {
    try {
      const { gameId } = req.params;
      
      AgentGameRunner.stopGame(parseInt(gameId));

      // Update game status in database
      await Game.update(parseInt(gameId), {
        status: 'STOPPED'
      });

      res.json({
        success: true,
        message: "Autonomous game stopped successfully"
      });
    } catch (error) {
      console.error("Error stopping autonomous game:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get agent performance analytics
  async getAgentAnalytics(req, res) {
    try {
      const { agentId } = req.params;
      
      const agent = await Agent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent not found"
        });
      }

      // Get participation stats
      const stats = await AgentGameParticipation.getAgentStats(agentId);
      
      // Get recent participations
      const recentGames = await AgentGameParticipation.findByAgentId(agentId, {
        limit: 10,
        offset: 0
      });

      // Calculate performance metrics
      const analytics = {
        agent_id: agentId,
        agent_name: agent.name,
        strategy: agent.strategy,
        risk_profile: agent.risk_profile,
        overall_stats: stats,
        recent_performance: recentGames.map(game => ({
          game_id: game.game_id,
          final_balance: game.final_balance,
          won: game.won,
          rank: game.rank,
          properties_owned: game.properties_owned,
          finished_at: game.finished_at
        })),
        win_rate_trend: this.calculateWinRateTrend(recentGames),
        average_balance_trend: this.calculateBalanceTrend(recentGames),
        strategy_effectiveness: await this.calculateStrategyEffectiveness(agentId)
      };

      res.json({
        success: true,
        message: "successful",
        data: analytics
      });
    } catch (error) {
      console.error("Error fetching agent analytics:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get leaderboard with live games context
  async getEnhancedLeaderboard(req, res) {
    try {
      const { limit = 50, offset = 0, metric = 'total_revenue' } = req.query;
      
      // Get basic leaderboard (now includes all agents)
      const leaderboard = await Agent.getLeaderboard({
        limit: parseInt(limit),
        offset: parseInt(offset),
        metric
      });

      // Enrich with live game participation
      const liveGames = AgentGameRunner.getLiveGames();
      const enhancedLeaderboard = await Promise.all(
        leaderboard.map(async (agent) => {
          // Get stats for agents with matches, otherwise provide defaults
          let stats;
          try {
            stats = await AgentGameParticipation.getAgentStats(agent.id);
          } catch (error) {
            // Agent with no matches - provide default stats
            stats = {
              totalGames: 0,
              wins: 0,
              winRate: 0,
              avgFinalBalance: 0,
              avgPropertiesOwned: 0,
              avgRank: 0
            };
          }

          const currentlyPlaying = liveGames.some(game => 
            game.agents_playing.some(playingAgent => playingAgent.id === agent.id)
          );

          // Calculate win rate if not present or use calculated one
          const winRate = parseFloat(agent.calculated_win_rate) || parseFloat(agent.win_rate) || parseFloat(stats.winRate) || 0;

          return {
            ...agent,
            win_rate: winRate, // Ensure win_rate is always a number
            stats,
            currently_playing: currentlyPlaying,
            live_game_info: currentlyPlaying ? 
              liveGames.find(game => 
                game.agents_playing.some(playingAgent => playingAgent.id === agent.id)
              ) : null
          };
        })
      );

      res.json({
        success: true,
        message: "successful",
        data: enhancedLeaderboard
      });
    } catch (error) {
      console.error("Error fetching enhanced leaderboard:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Batch create agents with different strategies
  async createAgentBatch(req, res) {
    try {
      const { 
        baseName, 
        ownerAddress, 
        strategies = ['aggressive', 'balanced', 'defensive'],
        count = 3 
      } = req.body;

      if (!baseName || !ownerAddress) {
        return res.status(400).json({
          success: false,
          message: "Base name and owner address are required"
        });
      }

      const createdAgents = [];

      for (let i = 0; i < count; i++) {
        const strategy = strategies[i % strategies.length];
        const agentName = `${baseName}_${strategy}_${i + 1}`;
        
        const agent = await Agent.create({
          name: agentName,
          address: `0xAUTO${Date.now()}${i}`,
          owner_address: ownerAddress,
          strategy,
          risk_profile: strategy,
          config: JSON.stringify({
            autonomous_mode: true,
            decision_engine: 'heuristic_scoring',
            reasoning_model: 'Gemini_2.5_Flash'
          })
        });

        createdAgents.push(agent);
      }

      res.status(201).json({
        success: true,
        message: `${count} agents created successfully`,
        data: createdAgents
      });
    } catch (error) {
      console.error("Error creating agent batch:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Helper methods
  calculateWinRateTrend(games) {
    if (games.length < 5) return null;
    
    const recent = games.slice(0, 5);
    const wins = recent.filter(g => g.won).length;
    return (wins / recent.length) * 100;
  },

  calculateBalanceTrend(games) {
    if (games.length < 5) return null;
    
    const recent = games.slice(0, 5);
    const avgBalance = recent.reduce((sum, g) => sum + (g.final_balance || 0), 0) / recent.length;
    return avgBalance;
  },

  async calculateStrategyEffectiveness(agentId) {
    // This would involve more complex analysis of strategy vs performance
    // For now, return basic metrics
    const stats = await AgentGameParticipation.getAgentStats(agentId);
    
    return {
      win_rate: stats.winRate,
      avg_final_balance: stats.avgFinalBalance,
      avg_properties_owned: stats.avgPropertiesOwned,
      avg_rank: stats.avgRank,
      effectiveness_score: (stats.winRate * 0.4) + 
                          ((stats.avgFinalBalance / 1000) * 0.3) + 
                          ((10 - stats.avgRank) * 0.3)
    };
  }
};

export default agentAutonomousController;
