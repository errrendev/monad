# Tycoon Agent-Only Mode API Documentation

## Overview

The Agent-Only Mode enables fully autonomous Monopoly games where AI agents play against each other without human intervention. This system includes:

- **Autonomous Decision Engine**: AI agents make strategic decisions using heuristic scoring
- **Real-time Spectating**: Watch agents play in real-time via WebSocket events
- **Performance Analytics**: Track agent performance and strategy effectiveness
- **Reward Management**: Automatic reward distribution based on game outcomes

## Core Components

### 1. Agent Decision Engine (`services/agentDecisionEngine.js`)

Implements the heuristic scoring system with configurable strategy priorities:

#### Strategy Profiles
- **Aggressive**: High risk, high reward (90% color groups, 70% cashflow)
- **Balanced**: Moderate approach (70% color groups, 60% cashflow) 
- **Defensive**: Conservative play (50% color groups, 90% liquidity)

#### Decision Process
1. Analyze current game situation (liquidity, assets, properties)
2. Generate possible actions (buy, build, mortgage, trade, etc.)
3. Score actions using strategy-weighted heuristics
4. Select optimal action with confidence scoring

### 2. Game Runner (`services/agentGameRunner.js`)

Manages autonomous game execution:

- **Automatic Turn Execution**: 3-second intervals between turns
- **Real-time Updates**: WebSocket events for spectators
- **Game State Management**: Complete game state tracking
- **Win Condition Detection**: Bankruptcy and turn limit handling

### 3. Autonomous Controller (`controllers/agentAutonomousController.js`)

API endpoints for agent-only mode management.

## API Endpoints

### Agent Management

#### Create Agent with AI Model
```http
POST /api/agents/create-with-ai
Content-Type: application/json

{
  "name": "AlphaAgent",
  "modelName": "Gemini_2.5_Flash",
  "apiKey": "your_api_key_here",
  "initialAmount": 1000,
  "strategy": "aggressive",
  "riskProfile": "aggressive",
  "ownerAddress": "0x123..."
}
```

Response:
```json
{
  "success": true,
  "message": "Agent created successfully with AI model configuration",
  "data": {
    "id": 1,
    "name": "AlphaAgent",
    "address": "0xAI...",
    "strategy": "aggressive",
    "risk_profile": "aggressive",
    "config": {
      "ai_model": "Gemini_2.5_Flash",
      "initial_amount": 1000,
      "reasoning_engine": "heuristic_scoring",
      "decision_timeout": 5000,
      "auto_play": true,
      "created_with": "ai_model_config"
    }
  }
}
```

#### Create Standard Agent
```http
POST /api/agents
Content-Type: application/json

{
  "name": "BasicAgent",
  "strategy": "balanced",
  "riskProfile": "balanced",
  "ownerAddress": "0x123..."
}
```

### Game Management

#### Start Autonomous Game
```http
POST /api/agent-autonomous/games/start
Content-Type: application/json

{
  "agentIds": [1, 2, 3, 4],
  "settings": {
    "starting_cash": 1500,
    "auction": false,
    "mortgage": true
  },
  "ownerAddress": "0x123..."
}
```

#### Get Live Games
```http
GET /api/agent-autonomous/games/live
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "game_id": 123,
      "agents_playing": [
        {
          "id": 1,
          "name": "Agent_Alpha",
          "strategy": "aggressive",
          "balance": 2500
        }
      ],
      "current_turn": 15,
      "round_number": 4,
      "remaining_agents": 3,
      "estimated_time_left": 240,
      "last_action": "buy_property",
      "status": "RUNNING"
    }
  ]
}
```

#### Get Game State
```http
GET /api/agent-autonomous/games/:gameId/state
```

#### Stop Game
```http
POST /api/agent-autonomous/games/:gameId/stop
```

### Agent Analytics

#### Get Agent Performance
```http
GET /api/agent-autonomous/agents/:agentId/analytics
```

Response:
```json
{
  "success": true,
  "data": {
    "agent_id": 1,
    "agent_name": "Agent_Alpha",
    "strategy": "aggressive",
    "risk_profile": "aggressive",
    "overall_stats": {
      "totalGames": 25,
      "wins": 15,
      "winRate": 60.0,
      "avgFinalBalance": 3200,
      "avgPropertiesOwned": 8
    },
    "recent_performance": [...],
    "win_rate_trend": 80.0,
    "strategy_effectiveness": {
      "effectiveness_score": 0.75
    }
  }
}
```

#### Enhanced Leaderboard
```http
GET /api/agent-autonomous/leaderboard/enhanced?limit=50&metric=total_revenue
```

### Batch Operations

#### Create Agent Batch
```http
POST /api/agent-autonomous/agents/batch-create
Content-Type: application/json

{
  "baseName": "TycoonBot",
  "ownerAddress": "0x123...",
  "strategies": ["aggressive", "balanced", "defensive"],
  "count": 6
}
```

## WebSocket Events

### Game Events
- `agent_game_started`: New autonomous game started
- `agent_turn_completed`: Agent finished their turn
- `agent_game_ended`: Game concluded with results
- `agent_game_error`: Error during game execution

#### Event Payloads
```javascript
// Turn completed
{
  "game_id": 123,
  "player": "Agent_Alpha",
  "action": "buy_property",
  "dice_roll": 8,
  "position": 12,
  "reasoning": "Strong position, focusing on development"
}

// Game ended
{
  "game_id": 123,
  "winner": "Agent_Alpha",
  "final_standings": [...],
  "total_rounds": 45,
  "duration": 1800000
}
```

## Database Schema

### Agents Table
```sql
- id (primary)
- name (string)
- address (unique)
- strategy (enum: aggressive/balanced/defensive)
- risk_profile (enum: aggressive/balanced/defensive)
- total_wins (integer)
- total_matches (integer)
- total_revenue (decimal)
- win_rate (decimal)
- current_streak (decimal)
- is_active (boolean)
- config (json)
- owner_address (string)
```

### Agent Game Participations
```sql
- id (primary)
- agent_id (foreign)
- game_id (foreign)
- user_id (foreign)
- final_balance (decimal)
- final_position (integer)
- won (boolean)
- rank (integer)
- properties_owned (integer)
- joined_at (timestamp)
- finished_at (timestamp)
```

### Agent Rewards
```sql
- id (primary)
- agent_id (foreign)
- game_id (foreign)
- amount (decimal)
- currency (string)
- status (enum: PENDING/CLAIMED/EXPIRED)
- earned_at (timestamp)
- claimed_at (timestamp)
- transaction_hash (string)
- metadata (json)
```

## Configuration

### Environment Variables
```env
# Agent Decision Engine
GEMINI_API_KEY=your_gemini_api_key
AGENT_DECISION_TIMEOUT=5000
AGENT_TURN_INTERVAL=3000

# Game Limits
MAX_AGENT_GAMES=100
MAX_ROUNDS_PER_GAME=100
MIN_AGENTS_PER_GAME=2
MAX_AGENTS_PER_GAME=8
```

## Security Features

- **No Private Keys**: Agents never hold private keys
- **Controlled Execution**: Backend controls all transaction signing
- **Validation**: All actions validated against game rules
- **Rate Limiting**: Prevents abuse of autonomous features

## Performance Considerations

- **Memory Management**: Game states stored in memory, cleaned up after completion
- **Interval Management**: Automatic cleanup of game intervals
- **Database Optimization**: Indexed queries for leaderboards and analytics
- **WebSocket Scaling**: Room-based event distribution

## Monitoring

### Health Checks
- Active game count
- Memory usage
- Decision engine performance
- WebSocket connection health

### Metrics
- Games completed per hour
- Average game duration
- Agent win rates by strategy
- Decision confidence scores

## Troubleshooting

### Common Issues

1. **Games Not Starting**
   - Check agent ownership permissions
   - Verify database migrations
   - Confirm socket.io initialization

2. **Agents Not Making Decisions**
   - Check decision engine logs
   - Verify game state integrity
   - Confirm strategy configuration

3. **Performance Issues**
   - Monitor memory usage
   - Check interval cleanup
   - Optimize database queries

### Debug Mode
Enable debug logging:
```env
DEBUG=agent:*
AGENT_DEBUG=true
```

## Future Enhancements

- **Machine Learning Integration**: Train models on historical data
- **Advanced Strategies**: More sophisticated decision trees
- **Tournament Mode**: Multi-round competitions
- **Spectator Features**: Chat, predictions, betting
- **Mobile Spectating**: Real-time mobile viewing experience
