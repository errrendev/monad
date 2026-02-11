import Game from "../models/Game.js";
import GamePlayer from "../models/GamePlayer.js";
import Property from "../models/Property.js";
import AgentDecisionEngine from "./agentDecisionEngine.js";
import db from "../config/database.js";

// Import io from server (will be initialized later)
let io;
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

class AgentGameRunner {
  constructor() {
    this.activeGames = new Map(); // gameId -> game state
    this.gameIntervals = new Map(); // gameId -> interval reference
    this.decisionEngine = AgentDecisionEngine;
  }

  async startAgentGame(gameId) {
    try {
      const game = await Game.findById(gameId);
      if (!game || !game.is_agent_only || game.status !== 'RUNNING') {
        throw new Error('Invalid agent-only game');
      }

      // Initialize game state
      const gameState = await this.initializeGameState(game);
      this.activeGames.set(gameId, gameState);

      // Start automatic turn execution
      this.startAutomaticTurnExecution(gameId);

      console.log(`🤖 Agent-only game ${gameId} started automatically`);
      
      // Emit game start to spectators
      io.emit('agent_game_started', {
        game_id: gameId,
        agents: gameState.players.map(p => ({
          id: p.id,
          name: p.name,
          strategy: p.strategy
        }))
      });

    } catch (error) {
      console.error('Error starting agent game:', error);
      throw error;
    }
  }

  async initializeGameState(game) {
    const players = await GamePlayer.findByGameId(game.id);
    const properties = await Property.findByGameId(game.id);

    // Enrich players with agent data
    const enrichedPlayers = await Promise.all(
      players.map(async (player) => {
        if (player.is_ai && player.agent_id) {
          // Get agent details
          const [agentDetails] = await db('agents')
            .where('id', player.agent_id)
            .select('name', 'strategy', 'risk_profile', 'config');
          
          return {
            ...player,
            agent_name: agentDetails?.name,
            strategy: agentDetails?.strategy || 'balanced',
            risk_profile: agentDetails?.risk_profile || 'balanced',
            config: agentDetails?.config ? JSON.parse(agentDetails.config) : {}
          };
        }
        return player;
      })
    );

    return {
      gameId: game.id,
      status: game.status,
      currentRound: 1,
      currentTurn: 0,
      players: enrichedPlayers,
      properties,
      boardPosition: 0,
      diceRoll: null,
      lastAction: null,
      gameLog: [],
      startTime: new Date()
    };
  }

  startAutomaticTurnExecution(gameId) {
    // Execute turns every 3 seconds for spectators to watch
    const interval = setInterval(async () => {
      await this.executeNextTurn(gameId);
    }, 3000);

    this.gameIntervals.set(gameId, interval);
  }

  async executeNextTurn(gameId) {
    try {
      const gameState = this.activeGames.get(gameId);
      if (!gameState || gameState.status !== 'RUNNING') {
        this.stopGame(gameId);
        return;
      }

      // Get current player
      const currentPlayer = this.getCurrentPlayer(gameState);
      if (!currentPlayer) {
        await this.endGame(gameId);
        return;
      }

      console.log(`🎯 Agent ${currentPlayer.agent_name} taking turn in game ${gameId}`);

      // Roll dice
      const diceRoll = this.rollDice();
      gameState.diceRoll = diceRoll;
      gameState.boardPosition = (currentPlayer.position + diceRoll) % 40;

      // Update player position
      await GamePlayer.update(currentPlayer.id, {
        position: gameState.boardPosition
      });

      // Get current property at new position
      const currentProperty = gameState.properties.find(
        p => p.position === gameState.boardPosition
      );

      // Make decision using AI engine
      const agent = {
        id: currentPlayer.agent_id,
        name: currentPlayer.agent_name,
        strategy: currentPlayer.strategy,
        risk_profile: currentPlayer.risk_profile,
        config: currentPlayer.config
      };

      const decision = await this.decisionEngine.makeDecision({
        current_player: currentPlayer,
        players: gameState.players,
        properties: gameState.properties,
        board_position: gameState.boardPosition,
        dice_roll: diceRoll,
        current_property: currentProperty
      }, agent);

      // Execute the decision
      await this.executeDecision(gameState, decision, currentPlayer);

      // Update game state
      gameState.lastAction = decision;
      gameState.gameLog.push({
        round: gameState.currentRound,
        player: currentPlayer.agent_name,
        action: decision.type,
        dice_roll: diceRoll,
        position: gameState.boardPosition,
        timestamp: new Date()
      });

      // Emit real-time update to spectators
      io.emit('agent_turn_completed', {
        game_id: gameId,
        player: currentPlayer.agent_name,
        action: decision.type,
        dice_roll: diceRoll,
        position: gameState.boardPosition,
        reasoning: decision.reasoning
      });

      // Move to next player
      this.moveToNextPlayer(gameState);

      // Check win conditions
      await this.checkWinConditions(gameId);

    } catch (error) {
      console.error('Error executing turn:', error);
      io.emit('agent_game_error', {
        game_id: gameId,
        error: error.message
      });
    }
  }

  async executeDecision(gameState, decision, player) {
    switch (decision.type) {
      case 'buy_property':
        await this.handleBuyProperty(decision.data.property_id, player);
        break;
        
      case 'pay_rent':
        await this.handlePayRent(decision.data.property_id, player, gameState.players);
        break;
        
      case 'mortgage':
        await this.handleMortgage(decision.data.property_id, player);
        break;
        
      case 'unmortgage':
        await this.handleUnmortgage(decision.data.property_id, player);
        break;
        
      case 'build_house':
        await this.handleBuildHouse(decision.data.property_id, player);
        break;
        
      case 'build_hotel':
        await this.handleBuildHotel(decision.data.property_id, player);
        break;
        
      case 'propose_trade':
        await this.handleTradeProposal(decision.data, player);
        break;
        
      case 'end_turn':
        // No action needed
        break;
        
      default:
        console.warn(`Unknown action type: ${decision.type}`);
    }
  }

  async handleBuyProperty(propertyId, player) {
    try {
      const property = await Property.findById(propertyId);
      if (!property || property.owner_id || player.balance < property.price) {
        return false;
      }

      // Update property ownership
      await Property.update(propertyId, {
        owner_id: player.id,
        is_mortgaged: false
      });

      // Deduct from player balance
      await GamePlayer.update(player.id, {
        balance: player.balance - property.price
      });

      console.log(`💰 ${player.agent_name} bought ${property.name} for $${property.price}`);
      return true;
    } catch (error) {
      console.error('Error buying property:', error);
      return false;
    }
  }

  async handlePayRent(propertyId, player, allPlayers) {
    try {
      const property = await Property.findById(propertyId);
      if (!property || !property.owner_id || property.owner_id === player.id) {
        return false;
      }

      const owner = allPlayers.find(p => p.id === property.owner_id);
      if (!owner) return false;

      // Calculate rent
      let rent = property.base_rent;
      if (property.houses) rent = property.rent_with_house * property.houses;
      if (property.hotels) rent = property.rent_with_hotel * property.hotels;

      // Check if player can pay rent
      if (player.balance < rent) {
        // Handle bankruptcy (simplified)
        await this.handleBankruptcy(player, owner, rent);
        return false;
      }

      // Transfer rent
      await GamePlayer.update(player.id, {
        balance: player.balance - rent
      });

      await GamePlayer.update(owner.id, {
        balance: owner.balance + rent
      });

      console.log(`💸 ${player.agent_name} paid $${rent} rent to ${owner.agent_name}`);
      return true;
    } catch (error) {
      console.error('Error paying rent:', error);
      return false;
    }
  }

  async handleMortgage(propertyId, player) {
    try {
      const property = await Property.findById(propertyId);
      if (!property || property.owner_id !== player.id || property.is_mortgaged) {
        return false;
      }

      const mortgageValue = property.price * 0.5; // 50% of property value

      await Property.update(propertyId, {
        is_mortgaged: true
      });

      await GamePlayer.update(player.id, {
        balance: player.balance + mortgageValue
      });

      console.log(`🏦 ${player.agent_name} mortgaged ${property.name} for $${mortgageValue}`);
      return true;
    } catch (error) {
      console.error('Error mortgaging property:', error);
      return false;
    }
  }

  async handleUnmortgage(propertyId, player) {
    try {
      const property = await Property.findById(propertyId);
      if (!property || property.owner_id !== player.id || !property.is_mortgaged) {
        return false;
      }

      const unmortgageCost = property.price * 0.55; // 50% + 10% interest

      if (player.balance < unmortgageCost) {
        return false;
      }

      await Property.update(propertyId, {
        is_mortgaged: false
      });

      await GamePlayer.update(player.id, {
        balance: player.balance - unmortgageCost
      });

      console.log(`🏠 ${player.agent_name} unmortgaged ${property.name} for $${unmortgageCost}`);
      return true;
    } catch (error) {
      console.error('Error unmortgaging property:', error);
      return false;
    }
  }

  async handleBuildHouse(propertyId, player) {
    try {
      const property = await Property.findById(propertyId);
      if (!property || property.owner_id !== player.id || property.is_mortgaged) {
        return false;
      }

      if (player.balance < property.house_price || property.houses >= 4) {
        return false;
      }

      await Property.update(propertyId, {
        houses: (property.houses || 0) + 1
      });

      await GamePlayer.update(player.id, {
        balance: player.balance - property.house_price
      });

      console.log(`🏗️ ${player.agent_name} built house on ${property.name}`);
      return true;
    } catch (error) {
      console.error('Error building house:', error);
      return false;
    }
  }

  async handleBuildHotel(propertyId, player) {
    try {
      const property = await Property.findById(propertyId);
      if (!property || property.owner_id !== player.id || property.is_mortgaged) {
        return false;
      }

      if (player.balance < property.hotel_price || property.houses !== 4) {
        return false;
      }

      await Property.update(propertyId, {
        houses: 0,
        hotels: 1
      });

      await GamePlayer.update(player.id, {
        balance: player.balance - property.hotel_price
      });

      console.log(`🏨 ${player.agent_name} built hotel on ${property.name}`);
      return true;
    } catch (error) {
      console.error('Error building hotel:', error);
      return false;
    }
  }

  async handleTradeProposal(tradeData, player) {
    // Simplified trade handling - would need more complex logic
    console.log(`🤝 ${player.agent_name} proposed a trade`);
    return true;
  }

  async handleBankruptcy(player, creditor, amount) {
    // Simplified bankruptcy handling
    console.log(`💀 ${player.agent_name} went bankrupt owing $${amount} to ${creditor.agent_name}`);
    
    // Transfer all properties to creditor
    const properties = await Property.findByOwner(player.id);
    for (const property of properties) {
      await Property.update(property.id, {
        owner_id: creditor.id
      });
    }

    // Set player balance to 0
    await GamePlayer.update(player.id, {
      balance: 0
    });
  }

  getCurrentPlayer(gameState) {
    const activePlayers = gameState.players.filter(p => p.balance > 0);
    if (activePlayers.length === 0) return null;
    
    const playerIndex = gameState.currentTurn % activePlayers.length;
    return activePlayers[playerIndex];
  }

  moveToNextPlayer(gameState) {
    gameState.currentTurn++;
    
    // Check if we've completed a round
    const activePlayers = gameState.players.filter(p => p.balance > 0);
    if (gameState.currentTurn % activePlayers.length === 0) {
      gameState.currentRound++;
    }
  }

  rollDice() {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
  }

  async checkWinConditions(gameId) {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;

    const activePlayers = gameState.players.filter(p => p.balance > 0);
    
    // Win condition 1: Only one player remaining
    if (activePlayers.length === 1) {
      await this.endGame(gameId, activePlayers[0]);
      return;
    }

    // Win condition 2: Turn limit reached (100 rounds)
    if (gameState.currentRound >= 100) {
      const winner = activePlayers.sort((a, b) => b.balance - a.balance)[0];
      await this.endGame(gameId, winner);
      return;
    }
  }

  async endGame(gameId, winner = null) {
    try {
      const gameState = this.activeGames.get(gameId);
      if (!gameState) return;

      // Update game status
      await Game.update(gameId, {
        status: 'COMPLETED',
        winner_id: winner?.id || null,
        ended_at: new Date()
      });

      gameState.status = 'COMPLETED';

      // Emit game end to spectators
      io.emit('agent_game_ended', {
        game_id: gameId,
        winner: winner?.agent_name,
        final_standings: gameState.players
          .filter(p => p.balance > 0)
          .sort((a, b) => b.balance - a.balance)
          .map(p => ({
            name: p.agent_name,
            balance: p.balance,
            properties: gameState.properties.filter(prop => prop.owner_id === p.id).length
          })),
        total_rounds: gameState.currentRound,
        duration: Date.now() - gameState.startTime.getTime()
      });

      // Stop automatic execution
      this.stopGame(gameId);

      console.log(`🏁 Agent-only game ${gameId} ended. Winner: ${winner?.agent_name || 'None'}`);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  }

  stopGame(gameId) {
    const interval = this.gameIntervals.get(gameId);
    if (interval) {
      clearInterval(interval);
      this.gameIntervals.delete(gameId);
    }
    
    this.activeGames.delete(gameId);
  }

  getLiveGames() {
    const liveGames = [];
    
    for (const [gameId, gameState] of this.activeGames) {
      const activePlayers = gameState.players.filter(p => p.balance > 0);
      
      liveGames.push({
        game_id: gameId,
        agents_playing: activePlayers.map(p => ({
          id: p.id,
          name: p.agent_name,
          strategy: p.strategy,
          balance: p.balance
        })),
        current_turn: gameState.currentTurn,
        round_number: gameState.currentRound,
        remaining_agents: activePlayers.length,
        estimated_time_left: Math.max(0, (100 - gameState.currentRound) * 3 * activePlayers.length), // seconds
        last_action: gameState.lastAction?.type,
        status: gameState.status
      });
    }
    
    return liveGames;
  }

  getGameState(gameId) {
    return this.activeGames.get(gameId);
  }
}

export default new AgentGameRunner();
