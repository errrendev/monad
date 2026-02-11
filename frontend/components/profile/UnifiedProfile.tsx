'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { BarChart2, Crown, Coins, Wallet, Ticket, ShoppingBag, Loader2, Trophy, TrendingUp, DollarSign, Star } from 'lucide-react';
import Link from 'next/link';
import avatar from '@/public/avatar.jpg';
import { useAccount, useBalance, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, type Address, type Abi } from 'viem';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

import { REWARD_CONTRACT_ADDRESSES, TYC_TOKEN_ADDRESS, USDC_TOKEN_ADDRESS, TYCOON_CONTRACT_ADDRESSES } from '@/constants/contracts';
import RewardABI from '@/context/abi/rewardabi.json';
import TycoonABI from '@/context/abi/tycoonabi.json';

const VOUCHER_ID_START = 1_000_000_000;
const COLLECTIBLE_ID_START = 2_000_000_000;

const isVoucherToken = (tokenId: bigint): boolean =>
  tokenId >= VOUCHER_ID_START && tokenId < COLLECTIBLE_ID_START;

const getPerkMetadata = (perk: number) => {
  const data = [
    null,
    { name: 'Extra Turn', icon: <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-3xl">⚡</div> },
    { name: 'Get Out of Jail Free', icon: <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl">👑</div> },
    { name: 'Double Rent', icon: <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-3xl">💰</div> },
    { name: 'Roll Boost', icon: <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl">✨</div> },
    { name: 'Instant Cash', icon: <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-3xl">💎</div> },
    { name: 'Teleport', icon: <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-3xl">📍</div> },
    { name: 'Shield', icon: <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl">🛡️</div> },
    { name: 'Property Discount', icon: <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-3xl">🏠</div> },
    { name: 'Tax Refund', icon: <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center text-3xl">↩️</div> },
    { name: 'Exact Roll', icon: <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl">🎯</div> },
  ];
  return data[perk] || { name: `Perk #${perk}`, icon: <div className="w-16 h-16 bg-gray-500/20 rounded-2xl flex items-center justify-center text-3xl">?</div> };
};

interface Agent {
  id: number;
  name: string;
  address: string;
  strategy?: string;
  risk_profile?: string;
  config?: {
    ai_model?: string;
    initial_amount?: number;
    reasoning_engine?: string;
    decision_timeout?: number;
    auto_play?: boolean;
  };
  total_wins?: number;
  total_matches?: number;
  total_revenue?: number;
  win_rate?: number;
  current_streak?: number;
  created_at?: string;
  updated_at?: string;
  owner_address?: string;
  username?: string;
}

interface HumanUser {
  id: number;
  username: string;
  address: string;
  created_at?: string;
}

interface AgentProfileData {
  agent?: Agent;
  user?: HumanUser;
  detailed_stats?: {
    totalGames: number;
    wins: number;
    winRate: number;
    avgFinalBalance: number;
    avgPropertiesOwned: number;
    avgRank: number;
  };
  performance_metrics?: {
    avg_final_balance: number;
    avg_properties_owned: number;
    avg_rank: number;
    best_rank: number | null;
    worst_rank: number | null;
    recent_form: string;
    games_analyzed: number;
  };
  recent_games?: Array<{
    game_id: number;
    game_code: string;
    final_balance: number;
    won: boolean;
    rank: number;
    properties_owned: number;
    finished_at: string;
  }>;
  rewards?: {
    total: number;
    claimable: number;
    recent: Array<{
      id: number;
      amount: number;
      currency: string;
      status: string;
      earned_at: string;
      game_id: number | null;
      metadata: any;
    }>;
  };
  live_game?: {
    game_id: number;
    current_turn: number;
    round_number: number;
    remaining_agents: number;
    estimated_time_left: number;
    last_action: string;
    status: string;
  } | null;
}

export default function UnifiedProfile() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  
  // Web3 hooks for human users
  const { address: walletAddress, isConnected, chainId } = useAccount();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Agent profile data
  const [profileData, setProfileData] = useState<AgentProfileData | null>(null);
  const [isAgent, setIsAgent] = useState<boolean>(false);

  useEffect(() => {
    if (profileId) {
      fetchProfileData();
    }
  }, [profileId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      
      // Try to fetch as agent first
      const agentResponse = await fetch(`${backendUrl}/api/agent-profiles/${profileId}`);
      const agentData = await agentResponse.json();
      
      if (agentData.success) {
        setProfileData(agentData.data);
        setIsAgent(true);
        return;
      }
      
      // If not agent, try to fetch as human user
      if (agentResponse.status === 404) {
        const userResponse = await fetch(`${backendUrl}/api/user-profiles/${profileId}`);
        const userData = await userResponse.json();
        
        if (userData.success) {
          setProfileData({
            user: userData.data,
            agent: undefined,
            detailed_stats: undefined,
            performance_metrics: undefined,
            recent_games: undefined,
            rewards: undefined,
            live_game: undefined
          });
          setIsAgent(false);
          return;
        }
      }
      
      setError('Profile not found');
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStrategyColor = (strategy?: string) => {
    if (!strategy) return 'text-gray-500';
    switch (strategy) {
      case 'aggressive': return 'text-red-500';
      case 'balanced': return 'text-blue-500';
      case 'defensive': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-red-900 border border-red-700 text-white px-6 py-4 rounded-lg max-w-md">
          <p className="text-red-200 mb-4">Error: {error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 text-white px-6 py-4 rounded-lg max-w-md">
          <p className="text-gray-300 mb-4">Profile not found</p>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { agent, user, detailed_stats, performance_metrics, recent_games, rewards, live_game } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {isAgent ? agent?.name?.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isAgent ? agent?.name : user?.username || 'Unknown'}
                </h1>
                <p className="text-gray-300 text-sm">
                  {isAgent ? `Agent ID: ${agent?.id}` : `User ID: ${user?.id || 'Unknown'}`}
                </p>
                <p className="text-gray-400 text-sm font-mono">
                  {isAgent ? (agent?.address || 'Unknown') : (user?.address || 'Unknown')}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isAgent && agent ? (
                <>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStrategyColor(agent.strategy)}`}>
                    {agent.strategy?.toUpperCase() || 'N/A'}
                  </span>
                  <span className="ml-2 text-gray-400 text-sm">
                    {agent.risk_profile?.toUpperCase() || 'N/A'}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                  HUMAN PLAYER
                </span>
              )}
            </div>
          </div>
          
          {/* Agent-specific info */}
          {isAgent && agent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">AI Model</p>
                <p className="text-white font-semibold">{agent.config?.ai_model || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Initial Amount</p>
                <p className="text-white font-semibold">{agent.config?.initial_amount || 0}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Auto Play</p>
                <p className="text-white font-semibold">{agent.config?.auto_play ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          )}
          
          {/* Common info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Address</p>
              <p className="text-white font-mono text-sm">
                {isAgent ? (agent?.address || 'Unknown') : (user?.address || 'Unknown')}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Member Since</p>
              <p className="text-white font-semibold">
                {new Date((isAgent ? agent?.created_at : user?.created_at) || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Stats - Only for agents */}
          {isAgent && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Performance Stats
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Wins</span>
                  <span className="text-white font-bold text-lg">{agent?.total_wins || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Matches</span>
                  <span className="text-white font-bold text-lg">{agent?.total_matches || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Win Rate</span>
                  <span className="text-green-400 font-bold text-lg">{parseFloat(String(agent?.win_rate || 0)).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Revenue</span>
                  <span className="text-blue-400 font-bold text-lg">{agent?.total_revenue || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Current Streak</span>
                  <span className="text-orange-400 font-bold text-lg">{agent?.current_streak || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Metrics - Only for agents */}
          {isAgent && performance_metrics && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-400" />
                Advanced Metrics
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg Final Balance</span>
                  <span className="text-white font-bold">{performance_metrics.avg_final_balance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg Properties</span>
                  <span className="text-white font-bold">{performance_metrics.avg_properties_owned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg Rank</span>
                  <span className="text-white font-bold">{performance_metrics.avg_rank}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Best Rank</span>
                  <span className="text-green-400 font-bold">{performance_metrics.best_rank || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Recent Form</span>
                  <span className="text-white font-bold capitalize">{performance_metrics.recent_form}</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Game Status - Only for agents */}
          {isAgent && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                Live Game Status
              </h2>
              {live_game ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Game ID</span>
                    <span className="text-white font-bold">{live_game.game_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Round</span>
                    <span className="text-white font-bold">{live_game.round_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Turn</span>
                    <span className="text-white font-bold">{live_game.current_turn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Players Left</span>
                    <span className="text-white font-bold">{live_game.remaining_agents}</span>
                  </div>
                  <div className="mt-4">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      LIVE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Agent not currently in a live game</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Games - Only for agents */}
          {isAgent && recent_games && recent_games.length > 0 && (
            <div className="lg:col-span-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Recent Games
              </h2>
              <div className="space-y-3">
                {recent_games.slice(0, 5).map((game, index) => (
                  <div key={game.game_id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">Game {game.game_code}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(game.finished_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          game.won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {game.won ? 'WON' : 'LOST'}
                        </span>
                        <span className="ml-2 text-gray-400 text-sm">
                          Rank: #{game.rank}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Balance: {game.final_balance} | Properties: {game.properties_owned}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewards - Only for agents */}
          {isAgent && rewards && (
            <div className="lg:col-span-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                Rewards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">Total Rewards</p>
                  <p className="text-blue-400 font-bold text-2xl">{rewards.total}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">Claimable</p>
                  <p className="text-green-400 font-bold text-2xl">{rewards.claimable}</p>
                </div>
              </div>
              {rewards.recent && rewards.recent.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-white font-medium mb-3">Recent Rewards</h3>
                  <div className="space-y-2">
                    {rewards.recent.slice(0, 3).map((reward) => (
                      <div key={reward.id} className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-white font-medium">{reward.amount} {reward.currency}</span>
                            <span className={`ml-2 text-xs px-2 py-1 rounded ${
                              reward.status === 'CLAIMED' ? 'bg-green-100 text-green-800' :
                              reward.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {reward.status}
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm">
                            {new Date(reward.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Human User Info - Only for humans */}
          {!isAgent && user && (
            <div className="lg:col-span-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                Player Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">Account Type</p>
                  <p className="text-blue-400 font-bold text-lg">Human Player</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">Member Since</p>
                  <p className="text-white font-bold text-lg">
                    {new Date(user.created_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => router.back()}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-lg font-medium transition-all duration-200"
          >
            ← Back to Previous Page
          </button>
        </div>
      </div>
    </div>
  );
}
