"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sustainabilityService } from "@/lib/sustainability.service";
import { DailyEntry, UserProfile, Challenge, EnvironmentalImpact } from "@/lib/types";
import Link from "next/link";
import { 
  Leaf, Trophy, Target, History, User, PlusCircle, 
  ArrowRight, Zap, Droplets, Trash2, Utensils, 
  TrendingUp, BarChart3, Globe, Award, ChevronRight,
  Sparkles, Flame, Cloud, Droplet, Recycle, TreePine,
  Home, TargetIcon, LineChart, Users, Settings, LogOut,
  Menu, X, Bell, Calendar, Clock, Battery, Wind, Sun
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Recharts компоненти
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showYesterdayReminder, setShowYesterdayReminder] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [emissionDistribution, setEmissionDistribution] = useState<any[]>([]);
  const [stats, setStats] = useState({
    streak: 0,
    weeklyReduction: 0,
    weeklyWater: 0,
    rankPercentile: 0
  });

  const [aiRecommendation, setAiRecommendation] = useState({
    co2: 0,
    water: 0,
    message: "Loading recommendations..."
  });

  const [dailyChanges, setDailyChanges] = useState({
    co2: 0,
    water: 0,
    energy: 0,
    waste: 0,
    food: 0
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (user) {
      loadDashboardData();
      setTimeout(() => setShowYesterdayReminder(true), 1500);
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await sustainabilityService.ensureUserProfile(user.uid, {
        displayName: user.displayName || "Eco Warrior",
        email: user.email || ""
      });
      
      const [p, t, c, entries, leaderboard, habits] = await Promise.all([
        sustainabilityService.getUserProfile(user.uid),
        sustainabilityService.getEntryForToday(user.uid),
        sustainabilityService.getActiveChallenges(user.uid),
        sustainabilityService.getRecentEntries(user.uid, 7),
        sustainabilityService.getGlobalLeaderboard(100),
        sustainabilityService.getSuggestedHabits(user.uid)
      ]);
      
      if (p) {
        setProfile(p);
        
        // Calculate Rank Percentile
        const userRankIndex = leaderboard.findIndex(u => u.id === user.uid);
        const percentile = userRankIndex !== -1 
          ? Math.max(1, Math.round(((userRankIndex + 1) / leaderboard.length) * 100))
          : 100;
        
        // Calculate Streak (Self-contained logic for now)
        const streak = calculateStreak(entries);
        
        // Calculate Weekly Totals
        const weeklyReduction = entries.reduce((acc, curr) => acc + (curr.emissions.co2 || 0), 0);
        const weeklyWater = entries.reduce((acc, curr) => acc + (curr.emissions.water || 0), 0);

        setStats({
          streak,
          weeklyReduction,
          weeklyWater,
          rankPercentile: percentile
        });

        // Set AI Recommendation
        if (habits && habits.length > 0) {
          const topHabit = habits[0] as any;
          setAiRecommendation({
            co2: topHabit.estimatedSavings?.co2 || 2.5,
            water: topHabit.estimatedSavings?.water || 50,
            message: topHabit.description
          });
        }
      }

      setTodayEntry(t);
      setChallenges(c);

      // Format Weekly Data for Chart
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const formattedWeekly = entries.reverse().map(entry => {
        const date = new Date(entry.date);
        return {
          day: days[date.getDay()],
          co2: entry.emissions.co2,
          water: entry.emissions.water,
          energy: entry.emissions.energy || 0
        };
      });
      setWeeklyData(formattedWeekly);

      // Calculate Emission Distribution
      const dist = calculateDistribution(entries);
      setEmissionDistribution(dist);

      // Calculate Daily Changes (compared to weekly average)
      if (t && entries.length > 1) {
        const avg = (key: keyof EnvironmentalImpact) => 
          entries.reduce((acc, curr) => acc + (curr.emissions[key as keyof typeof curr.emissions] || 0), 0) / entries.length;
        
        const calcChange = (current: number, average: number) => {
          if (average === 0) return 0;
          return Math.round(((current - average) / average) * 100);
        };

        setDailyChanges({
          co2: calcChange(t.emissions.co2, avg('co2')),
          water: calcChange(t.emissions.water, avg('water')),
          energy: calcChange(t.emissions.energy || 0, avg('energy')),
          waste: calcChange(t.emissions.waste || 0, avg('waste')),
          food: calcChange(t.emissions.food || 0, avg('food'))
        });
      }

    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (entries: DailyEntry[]) => {
    if (!entries.length) return 0;
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    
    let currentDate = today;
    
    // If no entry today, check if there was one yesterday to continue the streak
    const hasEntryToday = sortedEntries.some(e => e.date === today);
    if (!hasEntryToday) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      currentDate = yesterday.toISOString().split('T')[0];
    }

    for (const entry of sortedEntries) {
      if (entry.date === currentDate) {
        streak++;
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        currentDate = prevDate.toISOString().split('T')[0];
      } else if (entry.date < currentDate) {
        break;
      }
    }
    return streak;
  };

  const calculateDistribution = (entries: DailyEntry[]) => {
    const totals = { co2: 0, water: 0, food: 0, energy: 0, waste: 0 };
    entries.forEach(e => {
      totals.co2 += e.emissions.co2 || 0;
      totals.water += e.emissions.water || 0;
      totals.food += e.emissions.food || 0;
      totals.energy += e.emissions.energy || 0;
      totals.waste += e.emissions.waste || 0;
    });

    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    if (sum === 0) return [
      { name: 'Transport', value: 0, color: '#f59e0b' },
      { name: 'Food', value: 0, color: '#10b981' },
      { name: 'Energy', value: 0, color: '#3b82f6' },
      { name: 'Water', value: 0, color: '#06b6d4' },
      { name: 'Waste', value: 0, color: '#6b7280' },
    ];

    return [
      { name: 'Transport', value: Math.round((totals.co2 / sum) * 100), color: '#f59e0b' },
      { name: 'Food', value: Math.round((totals.food / sum) * 100), color: '#10b981' },
      { name: 'Energy', value: Math.round((totals.energy / sum) * 100), color: '#3b82f6' },
      { name: 'Water', value: Math.round((totals.water / sum) * 100), color: '#06b6d4' },
      { name: 'Waste', value: Math.round((totals.waste / sum) * 100), color: '#6b7280' },
    ];
  };

  const handleChallengeComplete = async (challengeId: string) => {
    if (!user) return;
    try {
      await sustainabilityService.completeChallenge(challengeId, user.uid, 50);
      loadDashboardData();
    } catch (error) {
      console.error("Challenge completion error:", error);
    }
  };

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (!user || !profile) return null;

  const aiRecommendationDisplay = aiRecommendation;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
          
          {/* Header with Title and Profile */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center gap-4 mb-6 lg:mb-8"
          >
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white uppercase italic">
                  DASHBOARD<span className="text-emerald-500">.</span>
                </h1>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Sustainability Overview</p>
              </div>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-4 bg-zinc-900/60 backdrop-blur-xl p-3 lg:p-4 rounded-2xl border border-zinc-800/50 shadow-2xl shadow-black/30 ml-auto">
              <div className="flex items-center gap-4">
                <div className="text-right hidden lg:block">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Total Points</p>
                  <motion.p 
                    key={profile.totalPoints}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-black text-emerald-400 font-mono italic"
                  >
                    {profile.totalPoints}
                  </motion.p>
                </div>
                <div className="hidden lg:block w-[1px] h-10 bg-gradient-to-b from-transparent via-zinc-700 to-transparent"></div>
                
                <Link href="/profile" className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-blue-500 p-[2px] rounded-full">
                    <div className="bg-zinc-950 rounded-full overflow-hidden w-10 h-10 flex items-center justify-center">
                      {profile.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-white" />
                      )}
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Mobile Points */}
              <div className="lg:hidden flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Points</p>
                  <p className="text-xl font-black text-emerald-400 font-mono italic">{profile.totalPoints}</p>
                </div>
              </div>
            </div>
          </motion.header>

          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6 lg:space-y-8">
              
              {/* Yesterday Reminder */}
              <AnimatePresence>
                {showYesterdayReminder && !todayEntry && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-r from-amber-900/20 to-amber-950/10 backdrop-blur-xl border border-amber-800/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full translate-x-12 -translate-y-12"></div>
                    <div className="flex items-start gap-4">
                      <div className="bg-amber-500/20 p-3 rounded-xl">
                        <History size={24} className="text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">Complete Yesterday&apos;s Entry</h3>
                        <p className="text-zinc-400 text-sm mb-4">Log your sustainability actions from yesterday to track your progress and earn points!</p>
                        <Link href="/journal">
                          <button className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold text-white text-sm hover:scale-105 transition-transform flex items-center gap-2">
                            Log Now <ChevronRight size={16} />
                          </button>
                        </Link>
                      </div>
                      <button 
                        onClick={() => setShowYesterdayReminder(false)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Daily Status Card */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 lg:p-8 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {todayEntry ? (
                  <div className="space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-2 animate-pulse">
                      <Sparkles size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Today&apos;s Impact Logged</span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                      Amazing work, <span className="text-emerald-400">{profile.displayName}!</span>
                    </h2>
                    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-emerald-500/20 p-2 rounded-lg">
                          <Sparkles size={16} className="text-emerald-400" />
                        </div>
                        <p className="text-zinc-300 text-sm italic">&quot;{todayEntry.aiComment}&quot;</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <ImpactStat 
                        icon={<Flame size={16} />} 
                        label="CO₂ Saved" 
                        value={`${todayEntry.emissions.co2}kg`} 
                        color="from-orange-500 to-red-500" 
                        change={dailyChanges.co2 >= 0 ? `+${dailyChanges.co2}%` : `${dailyChanges.co2}%`} 
                      />
                      <ImpactStat 
                        icon={<Droplet size={16} />} 
                        label="Water Saved" 
                        value={`${todayEntry.emissions.water}L`} 
                        color="from-blue-400 to-cyan-500" 
                        change={dailyChanges.water >= 0 ? `+${dailyChanges.water}%` : `${dailyChanges.water}%`} 
                      />
                      <ImpactStat 
                        icon={<Zap size={16} />} 
                        label="Energy Saved" 
                        value={`${todayEntry.emissions.energy || 0}kWh`} 
                        color="from-yellow-500 to-amber-500" 
                        change={dailyChanges.energy >= 0 ? `+${dailyChanges.energy}%` : `${dailyChanges.energy}%`} 
                      />
                      <ImpactStat 
                        icon={<Recycle size={16} />} 
                        label="Waste Reduced" 
                        value={`${todayEntry.emissions.waste || 0}kg`} 
                        color="from-emerald-500 to-green-500" 
                        change={dailyChanges.waste >= 0 ? `+${dailyChanges.waste}%` : `${dailyChanges.waste}%`} 
                      />
                      <ImpactStat 
                        icon={<TreePine size={16} />} 
                        label="Food Impact" 
                        value={`${todayEntry.emissions.food}/10`} 
                        color="from-purple-500 to-pink-500" 
                        change={dailyChanges.food >= 0 ? `+${dailyChanges.food}%` : `${dailyChanges.food}%`} 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-2">
                      <Zap size={12} className="text-blue-400" />
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Ready to make an impact</span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                      Ready to <span className="text-emerald-400">supercharge</span> your sustainability?
                    </h2>
                    
                    {/* AI Recommendation */}
                    <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-2xl p-6 border border-emerald-800/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-2 rounded-lg">
                          <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">AI Recommendation</h4>
                          <p className="text-sm text-zinc-400">Based on your patterns</p>
                        </div>
                      </div>
                      <p className="text-lg text-emerald-300 mb-4 italic">
                        &quot;Today you can save <span className="font-bold">{aiRecommendationDisplay.co2}kg CO₂</span> and{" "}
                        <span className="font-bold">{aiRecommendationDisplay.water}L water</span> by:&quot;
                      </p>
                      <p className="text-zinc-300">{aiRecommendationDisplay.message}</p>
                    </div>
                    
                    <Link href="/journal">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-6 flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-blue-600 rounded-2xl font-bold text-white shadow-2xl shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all duration-300"
                      >
                        <PlusCircle size={20} />
                        Start Today&apos;s Journal
                      </motion.button>
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* Charts Section */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 lg:p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Weekly Impact Analysis</h3>
                    <p className="text-sm text-zinc-400">Your sustainability progress over the past week</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs text-zinc-400">Live Data</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-64">
                    <h4 className="text-sm font-bold text-zinc-300 mb-4">CO₂ Reduction Trend</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData}>
                        <defs>
                          <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                            borderColor: '#374151',
                            borderRadius: '0.75rem',
                            color: 'white'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="co2" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fill="url(#colorCo2)" 
                          dot={{ stroke: '#10b981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="h-64">
                    <h4 className="text-sm font-bold text-zinc-300 mb-4">Emission Distribution</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={emissionDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}%`}
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {emissionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                            borderColor: '#374151',
                            borderRadius: '0.75rem',
                            color: 'white'
                          }}
                          formatter={(value) => [`${value}%`, 'Contribution']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-4 space-y-6 lg:space-y-8">
              
              {/* Quick Stats */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Quick Stats</h3>
                  <TrendingUp size={16} className="text-emerald-500" />
                </div>
                <div className="space-y-4">
                  <StatItem 
                    label="Current Streak" 
                    value={`${stats.streak} days`} 
                    icon="" 
                    color="text-orange-400"
                    progress={Math.min(100, (stats.streak / 30) * 100)}
                  />
                  <StatItem 
                    label="Weekly Reduction" 
                    value={`${stats.weeklyReduction.toFixed(1)} kg CO₂`} 
                    icon="" 
                    color="text-emerald-400"
                    progress={Math.min(100, (stats.weeklyReduction / 50) * 100)}
                  />
                  <StatItem 
                    label="Water Saved" 
                    value={`${stats.weeklyWater.toFixed(0)} L`} 
                    icon="" 
                    color="text-blue-400"
                    progress={Math.min(100, (stats.weeklyWater / 1000) * 100)}
                  />
                  <StatItem 
                    label="Rank Percentile" 
                    value={`Top ${stats.rankPercentile}%`} 
                    icon="" 
                    color="text-yellow-400"
                    progress={100 - stats.rankPercentile}
                  />
                </div>
              </motion.div>

              {/* Badges */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Badges Collection</h3>
                  <Trophy size={20} className="text-yellow-500" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {profile.badges.length > 0 ? profile.badges.slice(0, 6).map((badge, index) => (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-xl flex flex-col items-center justify-center p-3 hover:border-emerald-500/50 transition-all duration-300 group"
                    >
                      <Award size={24} className="text-emerald-400 mb-2" />
                      <span className="text-xs font-bold text-center text-white leading-tight">{badge}</span>
                    </motion.div>
                  )) : (
                    <div className="col-span-3 text-center py-8">
                      <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <Trophy size={32} className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-600 text-sm font-medium">Complete challenges to earn badges!</p>
                    </div>
                  )}
                </div>
                {profile.badges.length > 6 && (
                  <Link href="/achievements">
                    <button className="w-full mt-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                      View All ({profile.badges.length})
                      <ChevronRight size={12} />
                    </button>
                  </Link>
                )}
              </motion.div>

              {/* Active Challenges */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Active Challenges</h3>
                  <Target size={20} className="text-red-500" />
                </div>
                <div className="space-y-4">
                  {challenges.length > 0 ? challenges.slice(0, 3).map((challenge, index) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="p-4 bg-gradient-to-r from-zinc-900/50 to-transparent border border-zinc-800/50 rounded-xl hover:border-blue-500/30 transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-1">
                            {challenge.emissionType} • {challenge.pointsReward} pts
                          </p>
                          <h4 className="text-sm font-bold text-white mb-2">{challenge.title}</h4>
                        </div>
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                          <Target size={16} className="text-blue-400" />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleChallengeComplete(challenge.id!)}
                        className="text-xs font-bold uppercase text-zinc-500 hover:text-emerald-400 flex items-center gap-2 group-hover:gap-3 transition-all"
                      >
                        Mark Complete
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  )) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                        <Target size={24} className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-600 text-sm font-medium italic">Log entries to unlock new challenges!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ImpactStat({ icon, label, value, color, change }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  color: string,
  change?: string 
}) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      className="flex flex-col items-center gap-3 p-4 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl hover:border-emerald-500/30 transition-all duration-300"
    >
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
        {icon}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter leading-none mb-1">{label}</p>
        <p className="text-lg font-black text-white tracking-wide">{value}</p>
        {change && (
          <p className="text-[10px] font-bold text-emerald-400 mt-1">{change}</p>
        )}
      </div>
    </motion.div>
  );
}


function StatItem({ label, value, icon, color, progress }: { 
  label: string, 
  value: string, 
  icon: string, 
  color: string,
  progress?: number 
}) {
  return (
    <div className="p-3 bg-zinc-900/50 rounded-xl hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="text-sm text-zinc-400">{label}</span>
        </div>
        <span className={`text-sm font-bold ${color}`}>{value}</span>
      </div>
      {progress !== undefined && (
        <div className="w-full bg-zinc-800/50 rounded-full h-1.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
          ></motion.div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
        <div className="flex-1">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
            
            {/* Header Skeleton */}
            <div className="flex justify-between items-center gap-4 mb-6 lg:mb-8">
              <div className="flex items-center gap-3">
                <div>
                  <div className="w-48 h-8 bg-zinc-800 rounded-lg mb-1 animate-pulse"></div>
                  <div className="w-32 h-3 bg-zinc-800 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl ml-auto">
                <div className="text-right hidden lg:block space-y-2">
                  <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse"></div>
                  <div className="w-16 h-8 bg-zinc-800 rounded-lg animate-pulse"></div>
                </div>
                <div className="hidden lg:block w-[1px] h-10 bg-zinc-800"></div>
                <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20">
              
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 lg:p-8">
                  <div className="space-y-6">
                    <div className="w-32 h-6 bg-zinc-800 rounded-full animate-pulse"></div>
                    <div className="w-3/4 h-8 bg-zinc-800 rounded-lg animate-pulse"></div>
                    <div className="w-full h-32 bg-zinc-800 rounded-2xl animate-pulse"></div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 p-4 bg-zinc-800/50 rounded-2xl">
                          <div className="w-12 h-12 bg-zinc-700 rounded-xl animate-pulse"></div>
                          <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse"></div>
                          <div className="w-12 h-6 bg-zinc-700 rounded-lg animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-8">
                  <div className="w-48 h-6 bg-zinc-800 rounded-lg mb-6 animate-pulse"></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-64 bg-zinc-800/50 rounded-xl animate-pulse"></div>
                    <div className="h-64 bg-zinc-800/50 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6">
                  <div className="w-32 h-6 bg-zinc-800 rounded-lg mb-6 animate-pulse"></div>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-3 bg-zinc-800/50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-zinc-700 rounded animate-pulse"></div>
                            <div className="w-24 h-4 bg-zinc-700 rounded animate-pulse"></div>
                          </div>
                          <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse"></div>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-700 rounded-full animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6">
                  <div className="w-32 h-6 bg-zinc-800 rounded-lg mb-6 animate-pulse"></div>
                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-square bg-zinc-800/50 border border-zinc-700/50 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}