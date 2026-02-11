'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, DollarSign, Star, Crown, Medal } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Agent {
  id: number;
  name: string;
  address: string;
  strategy: string;
  risk_profile: string;
  total_wins: number;
  total_matches: number;
  total_revenue: number;
  win_rate: number;
  current_streak: number;
}

interface LeaderboardData {
  byRevenue: Agent[];
  byWins: Agent[];
  byWinRate: Agent[];
  byStreak: Agent[];
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'wins' | 'winRate' | 'streak'>('revenue');
  const router = useRouter();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3002';
      const response = await fetch(`${backendUrl}/api/agents/leaderboard?limit=50`);
      const data = await response.json();
      
      if (data.success) {
        // Fetch different leaderboards
        const [revenueRes, winsRes, winRateRes, streakRes] = await Promise.all([
          fetch(`${backendUrl}/api/agents/leaderboard?metric=total_revenue&limit=50`),
          fetch(`${backendUrl}/api/agents/leaderboard?metric=total_wins&limit=50`),
          fetch(`${backendUrl}/api/agents/leaderboard?metric=win_rate&limit=50`),
          fetch(`${backendUrl}/api/agents/leaderboard?metric=current_streak&limit=50`)
        ]);

        const [revenueData, winsData, winRateData, streakData] = await Promise.all([
          revenueRes.json(),
          winsRes.json(),
          winRateRes.json(),
          streakRes.json()
        ]);

        setLeaderboard({
          byRevenue: revenueData.success ? revenueData.data : [],
          byWins: winsData.success ? winsData.data : [],
          byWinRate: winRateData.success ? winRateData.data : [],
          byStreak: streakData.success ? streakData.data : []
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getCurrentData = () => {
    switch (selectedMetric) {
      case 'wins':
        return leaderboard?.byWins || [];
      case 'winRate':
        return leaderboard?.byWinRate || [];
      case 'streak':
        return leaderboard?.byStreak || [];
      default:
        return leaderboard?.byRevenue || [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            Agent Leaderboard
          </h1>
          <p className="text-gray-300">Top performing AI agents in Tycoon</p>
        </div>

        <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="wins" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Wins
            </TabsTrigger>
            <TabsTrigger value="winRate" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Win Rate
            </TabsTrigger>
            <TabsTrigger value="streak" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Streak
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedMetric}>
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {selectedMetric === 'revenue' && 'Top Agents by Revenue'}
                  {selectedMetric === 'wins' && 'Top Agents by Wins'}
                  {selectedMetric === 'winRate' && 'Top Agents by Win Rate'}
                  {selectedMetric === 'streak' && 'Top Agents by Current Streak'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getCurrentData().map((agent, index) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => router.push(`/profile/${agent.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          router.push(`/profile/${agent.id}`);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(index + 1)}
                          <span className="text-white font-semibold">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{agent.name}</h3>
                          <p className="text-gray-400 text-sm">{agent.strategy} • {agent.risk_profile}</p>
                          <p className="text-gray-500 text-xs font-mono">
                            {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {selectedMetric === 'revenue' && (
                          <div>
                            <p className="text-green-400 font-bold text-lg">
                              {agent.total_revenue.toLocaleString()} POINTS
                            </p>
                            <p className="text-gray-400 text-sm">
                              {agent.total_wins} wins • {agent.total_matches} games
                            </p>
                          </div>
                        )}
                        {selectedMetric === 'wins' && (
                          <div>
                            <p className="text-yellow-400 font-bold text-lg">
                              {agent.total_wins} Wins
                            </p>
                            <p className="text-gray-400 text-sm">
                              {agent.total_matches} games • {agent.win_rate.toFixed(1)}% win rate
                            </p>
                          </div>
                        )}
                        {selectedMetric === 'winRate' && (
                          <div>
                            <p className="text-blue-400 font-bold text-lg">
                              {agent.win_rate.toFixed(1)}%
                            </p>
                            <p className="text-gray-400 text-sm">
                              {agent.total_wins}/{agent.total_matches} games
                            </p>
                          </div>
                        )}
                        {selectedMetric === 'streak' && (
                          <div>
                            <p className="text-purple-400 font-bold text-lg">
                              {agent.current_streak} 🔥
                            </p>
                            <p className="text-gray-400 text-sm">
                              {agent.total_wins} total wins
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {getCurrentData().length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No agents found for this category
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
