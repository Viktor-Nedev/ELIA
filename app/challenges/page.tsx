"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { sustainabilityService } from "@/lib/sustainability.service";
import { Challenge, UserProfile } from "@/lib/types";
import { 
  ArrowLeft, Target, CheckCircle2, Trophy, Clock, Sparkles, Plus, RefreshCw, 
  TrendingUp, Crown, Star, Zap, Flame, Droplet, Recycle, Utensils,
  Calendar, Award as AwardIcon, TrendingUp as TrendingUpIcon, 
  ChevronRight, Circle, AlertCircle, Rocket
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { generatePersonalizedHabits } from "@/app/actions/habit.actions";
import { Habit } from "@/lib/types";

export default function ChallengesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [suggestedHabits, setSuggestedHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [leaderboardType, setLeaderboardType] = useState<'weekly' | 'monthly'>('weekly');
  const [completedChallenges, setCompletedChallenges] = useState<number>(0);

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [rankPercentile, setRankPercentile] = useState<string>("Top 50%");
  const [streak, setStreak] = useState<number>(0);

  const impactIcons: Record<string, any> = {
    co2: <Flame size={14} className="text-orange-500" />,
    water: <Droplet size={14} className="text-blue-500" />,
    energy: <Zap size={14} className="text-yellow-500" />,
    waste: <Recycle size={14} className="text-zinc-500" />,
    food: <Utensils size={14} className="text-emerald-500" />,
  };

  useEffect(() => {
    if (user) {
      loadChallenges();
      fetchHabits();
      loadCompletedCount();
      loadLeaderboard();
      loadUserProfile();
      loadStreak();
    }
  }, [user]);

  const fetchHabits = async (isManualRefresh = false) => {
    if (!user) return;
    setHabitsLoading(true);
    try {
      if (!isManualRefresh) {
        const profile = await sustainabilityService.getUserProfile(user.uid);
        if (profile?.suggestedHabits && profile.suggestedHabits.length > 0) {
          setSuggestedHabits(profile.suggestedHabits);
          setHabitsLoading(false);
          return;
        }
      }

      const habits = await generatePersonalizedHabits();
      setSuggestedHabits(habits);

      await sustainabilityService.savePersistedHabits(user.uid, habits);
    } catch (err) {
      console.error("Habits Error:", err);
    } finally {
      setHabitsLoading(false);
    }
  };

  const loadChallenges = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await sustainabilityService.getActiveChallenges(user.uid);
      setChallenges(data);
    } catch (err) {
      console.error("Challenges Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedCount = async () => {
    if (!user) return;
    try {
      const completed = await sustainabilityService.getCompletedChallenges(user.uid);
      setCompletedChallenges(completed.length);
    } catch (err) {
      console.error("Load completed count error:", err);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const topUsers = await sustainabilityService.getGlobalLeaderboard(5);
      const mapped = topUsers.map((u, i) => ({
        rank: i + 1,
        name: u.displayName || "Anonymous",
        points: u.totalPoints || 0,
        avatar: u.id === user?.uid ? "⭐" : ["🌱", "🌍", "♻️", "⚡"][i % 4] || "👤",
        change: "▲",
        id: u.id
      }));
      setLeaderboardData(mapped);
    } catch (err) {
      console.error("Leaderboard Load Error:", err);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const profile = await sustainabilityService.getUserProfile(user.uid);
      setUserProfile(profile);
      
      // Calculate Percentile
      const allUsers = await sustainabilityService.getGlobalLeaderboard(100);
      const myPoints = profile?.totalPoints || 0;
      const countBetter = allUsers.filter(u => (u.totalPoints || 0) > myPoints).length;
      const percentile = Math.max(1, Math.round((countBetter / allUsers.length) * 100));
      setRankPercentile(`Top ${percentile}%`);
    } catch (err) {
      console.error("Profile Load Error:", err);
    }
  };

  const loadStreak = async () => {
    if (!user) return;
    try {
      const entries = await sustainabilityService.getRecentEntries(user.uid, 14);
      setStreak(calculateStreak(entries));
    } catch (err) {
      console.error("Streak Load Error:", err);
    }
  };

  const calculateStreak = (entries: any[]) => {
    if (!entries.length) return 0;
    let streak = 0;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date().toISOString().split('T')[0];
    let current = today;
    const hasToday = sorted.some(e => e.date === today);
    if (!hasToday) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      current = yesterday.toISOString().split('T')[0];
    }
    for (const entry of sorted) {
      if (entry.date === current) {
        streak++;
        const prev = new Date(current);
        prev.setDate(prev.getDate() - 1);
        current = prev.toISOString().split('T')[0];
      } else if (entry.date < current) break;
    }
    return streak;
  };

  const handleComplete = async (c: Challenge) => {
    if (!user || !c.id) return;
    try {
      await sustainabilityService.completeChallenge(c.id, user.uid, c.pointsReward);
      loadChallenges();
      loadCompletedCount();
    } catch (err) {
      console.error("Complete Challenge Error:", err);
    }
  };

  const handleActivateHabit = async (habit: Habit) => {
    if (!user) return;
    setActivatingId(habit.title);
    try {
      await sustainabilityService.activateHabitAsChallenge(user.uid, habit);
      setSuggestedHabits(prev => prev.filter(h => h.title !== habit.title));
      loadChallenges();
    } catch (err) {
      console.error("Activate Habit Error:", err);
    } finally {
      setActivatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
            
            {/* Header */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center gap-4 mb-6 lg:mb-8"
            >
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                  <Target size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                    Eco <span className="text-emerald-500">Challenges</span>
                  </h1>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Mission Control Center</p>
                </div>
              </div>

              <div className="lg:hidden">
                <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
                  Eco <span className="text-emerald-500">Challenges</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Missions</p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 bg-zinc-900/60 backdrop-blur-xl px-4 py-3 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-colors">
                  <ArrowLeft size={16} />
                  <span className="text-sm font-medium hidden lg:inline">Dashboard</span>
                </Link>
              </div>
            </motion.header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20">
              
              {/* Left Column - Active Challenges */}
              <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                
                {/* Stats Overview */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 backdrop-blur-xl border border-emerald-800/30 rounded-2xl p-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                      icon={<Target size={20} />}
                      label="Active Missions"
                      value={challenges.length}
                      color="text-emerald-400"
                    />
                    <StatCard 
                      icon={<Trophy size={20} />}
                      label="Completed"
                      value={completedChallenges}
                      color="text-yellow-400"
                    />
                    <StatCard 
                      icon={<TrendingUpIcon size={20} />}
                      label="Total Points"
                      value={(userProfile?.totalPoints || 0).toLocaleString()}
                      color="text-blue-400"
                    />
                    <StatCard 
                      icon={<RankIcon rank={leaderboardData.findIndex(p => p.id === user?.uid) + 1 || 0} />}
                      label="Global Rank"
                      value={rankPercentile}
                      color="text-purple-400"
                    />
                  </div>
                </motion.div>

                {/* Active Challenges */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Active Missions</h2>
                      <p className="text-sm text-zinc-400">Complete challenges to earn points and badges</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Rocket size={16} className="text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase">AI-Generated</span>
                    </div>
                  </div>

                  {challenges.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {challenges.map((c, idx) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          whileHover={{ y: -5 }}
                          className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 group hover:border-emerald-500/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                                {impactIcons[c.emissionType] || <Target size={16} className="text-emerald-400" />}
                              </div>
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{c.emissionType}</span>
                                <h3 className="text-lg font-bold text-white mt-1">{c.title}</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy size={14} className="text-yellow-500" />
                              <span className="text-sm font-black text-yellow-400">+{c.pointsReward}</span>
                            </div>
                          </div>

                          <p className="text-sm text-zinc-400 mb-6">{c.description}</p>

                          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center gap-2">
                              <Clock size={12} className="text-zinc-600" />
                              <span className="text-xs text-zinc-500">Expires in 2 days</span>
                            </div>
                            <button
                              onClick={() => handleComplete(c)}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold text-white text-sm hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 size={14} />
                              Complete
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-zinc-900/20 border border-dashed border-zinc-800/50 rounded-2xl p-12 text-center">
                      <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <Target size={32} className="text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No Active Missions</h3>
                      <p className="text-zinc-400 mb-6">Log your daily activities to generate personalized challenges!</p>
                      <Link href="/journal">
                        <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold text-white hover:scale-105 transition-all">
                          Go to Journal
                        </button>
                      </Link>
                    </div>
                  )}
                </motion.div>

                {/* Personalized Habits */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-blue-400" />
                        <h3 className="text-lg font-bold text-white">AI-Personalized Habits</h3>
                      </div>
                      <p className="text-sm text-zinc-400">Based on your recent sustainability patterns</p>
                    </div>
                    <button
                      onClick={() => fetchHabits(true)}
                      disabled={habitsLoading}
                      className="p-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:border-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={`${habitsLoading ? "animate-spin" : "text-zinc-400"}`} />
                    </button>
                  </div>

                  {habitsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-zinc-800/30 rounded-xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {suggestedHabits.map((habit, idx) => (
                          <motion.div
                            key={habit.title}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl hover:border-blue-500/30 transition-all group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="px-2 py-1 bg-zinc-900/50 rounded-md">
                                <span className="text-xs font-bold uppercase tracking-tighter text-zinc-400">
                                  {habit.difficulty}
                                </span>
                              </div>
                              <div className="p-1.5 rounded-md bg-blue-500/10">
                                {impactIcons[habit.impactType] || <Star size={12} className="text-blue-400" />}
                              </div>
                            </div>
                            
                            <h4 className="font-bold text-white text-sm mb-2">{habit.title}</h4>
                            <p className="text-xs text-zinc-400 mb-4">{habit.description}</p>

                            <button
                              onClick={() => handleActivateHabit(habit)}
                              disabled={activatingId === habit.title}
                              className="w-full py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:border-blue-500/30 transition-all flex items-center justify-center gap-2"
                            >
                              {activatingId === habit.title ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Plus size={12} />
                                  Activate Mission
                                </>
                              )}
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Column - Leaderboard & Stats */}
              <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                
                {/* Leaderboard */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Leaderboard</h3>
                    <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg">
                      <button
                        onClick={() => setLeaderboardType('weekly')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          leaderboardType === 'weekly' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Weekly
                      </button>
                      <button
                        onClick={() => setLeaderboardType('monthly')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          leaderboardType === 'monthly' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {leaderboardData.map((player, idx) => (
                      <div 
                        key={player.id || player.rank} 
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          player.id === user?.uid 
                            ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20' 
                            : 'bg-zinc-800/30 hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            player.rank <= 3 ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20' : 'bg-zinc-800/50'
                          }`}>
                            {player.rank <= 3 ? (
                              <Crown size={14} className={player.rank === 1 ? 'text-yellow-400' : 'text-amber-400'} />
                            ) : (
                              <span className="text-sm font-bold text-zinc-300">{player.rank}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{player.avatar}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{player.name}</p>
                              <p className="text-xs text-zinc-500">{player.change} {leaderboardType === 'weekly' ? 'this week' : 'this month'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy size={12} className="text-yellow-500" />
                          <span className="text-sm font-bold text-white">{player.points.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800/30">
                    <Link href="/community" className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                      View Full Leaderboard
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </motion.div>

                {/* Progress Stats */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-b from-emerald-900/20 to-blue-900/20 backdrop-blur-xl border border-emerald-800/30 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Your Progress</h3>
                      <p className="text-sm text-emerald-400">Challenge completion rate</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">Completion Rate</span>
                      <span className="text-lg font-bold text-emerald-400">78%</span>
                    </div>
                    <div className="w-full bg-zinc-800/50 rounded-full h-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '78%' }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                      ></motion.div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <span className="text-sm text-zinc-300">Avg Points/Day</span>
                      <span className="text-lg font-bold text-blue-400">42</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">Current Streak</span>
                      <span className="text-lg font-bold text-orange-400">{streak} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">Next Milestone</span>
                      <span className="text-lg font-bold text-purple-400">2,000 pts</span>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Tips */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Pro Tips</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <p className="text-sm text-zinc-300">Complete 3 challenges daily for bonus points</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <p className="text-sm text-zinc-300">Higher difficulty = more points & better badges</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <p className="text-sm text-zinc-300">Check back daily for new personalized missions</p>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </main>
          </div>
    </div>
  );
}


function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string | number, 
  color: string 
}) {
  return (
    <div className="text-center">
      <div className="inline-flex p-3 rounded-xl bg-zinc-800/30 mb-2">
        <div className={color}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p>
    </div>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={20} className="text-yellow-500" />;
  if (rank === 2) return <Crown size={20} className="text-zinc-400" />;
  if (rank === 3) return <Crown size={20} className="text-amber-700" />;
  return <AwardIcon size={20} className="text-purple-500" />;
}