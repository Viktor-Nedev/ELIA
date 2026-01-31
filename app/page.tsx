"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sustainabilityService } from "@/lib/sustainability.service";
import { DailyEntry, UserProfile, Challenge } from "@/lib/types";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Chart data
  const weeklyData = [
    { day: 'Mon', co2: 3.2, water: 120, energy: 15 },
    { day: 'Tue', co2: 2.8, water: 95, energy: 12 },
    { day: 'Wed', co2: 2.5, water: 80, energy: 10 },
    { day: 'Thu', co2: 3.0, water: 110, energy: 14 },
    { day: 'Fri', co2: 2.2, water: 70, energy: 9 },
    { day: 'Sat', co2: 1.8, water: 60, energy: 7 },
    { day: 'Sun', co2: 1.5, water: 50, energy: 6 },
  ];

  const emissionDistribution = [
    { name: 'Transport', value: 35, color: '#f59e0b' },
    { name: 'Food', value: 25, color: '#10b981' },
    { name: 'Energy', value: 20, color: '#3b82f6' },
    { name: 'Water', value: 15, color: '#06b6d4' },
    { name: 'Waste', value: 5, color: '#6b7280' },
  ];

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
      
      const [p, t, c] = await Promise.all([
        sustainabilityService.getUserProfile(user.uid),
        sustainabilityService.getEntryForToday(user.uid),
        sustainabilityService.getActiveChallenges(user.uid)
      ]);
      
      setProfile(p);
      setTodayEntry(t);
      setChallenges(c);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
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

  const aiRecommendation = {
    co2: 2.3,
    water: 58,
    message: "Take shorter showers and use public transport today!"
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Main Container */}
      <div className="flex min-h-screen">
{/* Sidebar for Desktop */}
<aside className="hidden lg:flex w-64 flex-col bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800/50">
  <div className="flex flex-col h-full p-6">
    {/* Sidebar Logo */}
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
          <Leaf size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white uppercase italic">
            Eco<span className="text-emerald-500">Tracker</span>
          </h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Dashboard</p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1">
      <div className="space-y-1">
        <NavItem 
          href="/" 
          icon={<Home size={20} />} 
          label="Dashboard" 
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        />
        <NavItem 
          href="/journal" 
          icon={<PlusCircle size={20} />} 
          label="Daily Journal" 
          active={activeTab === 'journal'}
          onClick={() => setActiveTab('journal')}
        />
        <NavItem 
          href="/analytics" 
          icon={<BarChart3 size={20} />} 
          label="Analytics" 
          active={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
        />
        <NavItem 
          href="/challenges" 
          icon={<TargetIcon size={20} />} 
          label="Challenges" 
          active={activeTab === 'challenges'}
          onClick={() => setActiveTab('challenges')}
        />
        <NavItem 
          href="/community" 
          icon={<Users size={20} />} 
          label="Community" 
          active={activeTab === 'community'}
          onClick={() => setActiveTab('community')}
        />
        <NavItem 
          href="/achievements" 
          icon={<Award size={20} />} 
          label="Achievements" 
          active={activeTab === 'achievements'}
          onClick={() => setActiveTab('achievements')}
        />
      </div>
    </nav>

    {/* Bottom Actions - БЕЗ разстояние между Achievements и Settings */}
    <div className="mt-2 pt-4 border-t border-zinc-800/50">
      <div className="space-y-1">
        <NavItem 
          href="/settings" 
          icon={<Settings size={20} />} 
          label="Settings" 
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
        <Link 
          href="/login" 
          className="flex items-center gap-3 p-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </Link>
      </div>
    </div>
  </div>
</aside>

{/* Mobile Sidebar */}
<AnimatePresence>
  {sidebarOpen && (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      className="lg:hidden fixed left-0 top-0 h-full w-64 bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800/50 z-40"
    >
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
            <Leaf size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase italic">
              Eco<span className="text-emerald-500">Tracker</span>
            </h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Dashboard</p>
          </div>
        </div>
        
        <nav className="flex-1">
          <div className="space-y-1">
            <NavItem 
              href="/" 
              icon={<Home size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'}
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            />
            <NavItem 
              href="/journal" 
              icon={<PlusCircle size={20} />} 
              label="Daily Journal" 
              active={activeTab === 'journal'}
              onClick={() => { setActiveTab('journal'); setSidebarOpen(false); }}
            />
            <NavItem 
              href="/analytics" 
              icon={<BarChart3 size={20} />} 
              label="Analytics" 
              active={activeTab === 'analytics'}
              onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
            />
            <NavItem 
              href="/challenges" 
              icon={<TargetIcon size={20} />} 
              label="Challenges" 
              active={activeTab === 'challenges'}
              onClick={() => { setActiveTab('challenges'); setSidebarOpen(false); }}
            />
            <NavItem 
              href="/community" 
              icon={<Users size={20} />} 
              label="Community" 
              active={activeTab === 'community'}
              onClick={() => { setActiveTab('community'); setSidebarOpen(false); }}
            />
            <NavItem 
              href="/achievements" 
              icon={<Award size={20} />} 
              label="Achievements" 
              active={activeTab === 'achievements'}
              onClick={() => { setActiveTab('achievements'); setSidebarOpen(false); }}
            />
          </div>
        </nav>
        
        {/* Bottom Actions - БЕЗ разстояние между Achievements и Settings */}
        <div className="mt-2 pt-4 border-t border-zinc-800/50">
          <div className="space-y-1">
            <NavItem 
              href="/settings" 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={activeTab === 'settings'}
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
            />
            <Link 
              href="/login" 
              className="flex items-center gap-3 p-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Logout</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.aside>
  )}
</AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
            
            {/* Header with Logo and Profile */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center gap-4 mb-6 lg:mb-8"
            >
              {/* Logo - видимо само на десктоп */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                  <Leaf size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                    Eco<span className="text-emerald-500">Tracker</span>
                  </h1>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Sustainability Dashboard</p>
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
                  
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-zinc-400" />
                    <div className="relative">
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </div>
                  </div>
                  
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
                          change="+12%" 
                        />
                        <ImpactStat 
                          icon={<Droplet size={16} />} 
                          label="Water Saved" 
                          value={`${todayEntry.emissions.water}L`} 
                          color="from-blue-400 to-cyan-500" 
                          change="+8%" 
                        />
                        <ImpactStat 
                          icon={<Zap size={16} />} 
                          label="Energy Saved" 
                          value={`${todayEntry.emissions.energy}kWh`} 
                          color="from-yellow-500 to-amber-500" 
                          change="+15%" 
                        />
                        <ImpactStat 
                          icon={<Recycle size={16} />} 
                          label="Waste Reduced" 
                          value={`${todayEntry.emissions.waste}kg`} 
                          color="from-emerald-500 to-green-500" 
                          change="+20%" 
                        />
                        <ImpactStat 
                          icon={<TreePine size={16} />} 
                          label="Food Impact" 
                          value={`${todayEntry.emissions.food}/10`} 
                          color="from-purple-500 to-pink-500" 
                          change="+5%" 
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
                          &quot;Today you can save <span className="font-bold">{aiRecommendation.co2}kg CO₂</span> and{" "}
                          <span className="font-bold">{aiRecommendation.water}L water</span> by:&quot;
                        </p>
                        <p className="text-zinc-300">{aiRecommendation.message}</p>
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
                      value="7 days" 
                      icon="" 
                      color="text-orange-400"
                      progress={70}
                    />
                    <StatItem 
                      label="Weekly Reduction" 
                      value="15.2 kg CO₂" 
                      icon="" 
                      color="text-emerald-400"
                      progress={85}
                    />
                    <StatItem 
                      label="Water Saved" 
                      value="320 L" 
                      icon="" 
                      color="text-blue-400"
                      progress={60}
                    />
                    <StatItem 
                      label="Rank Percentile" 
                      value="Top 15%" 
                      icon="" 
                      color="text-yellow-400"
                      progress={85}
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

function NavItem({ href, icon, label, active, onClick }: { 
  href: string, 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean,
  onClick?: () => void
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 5 }}
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
          active 
            ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-white' 
            : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
        }`}
      >
        <div className={`p-2 rounded-lg ${
          active 
            ? 'bg-gradient-to-r from-emerald-500 to-blue-500' 
            : 'bg-zinc-800 group-hover:bg-emerald-500/20'
        }`}>
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
        {active && (
          <div className="ml-auto">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </motion.div>
    </Link>
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
      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:flex w-64 flex-col bg-zinc-900/80 border-r border-zinc-800/50 p-6">
          <div className="flex items-center gap-3 mb-8 pt-2">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl animate-pulse"></div>
            <div>
              <div className="w-32 h-6 bg-zinc-800 rounded-lg mb-1 animate-pulse"></div>
              <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-1 flex-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full h-12 bg-zinc-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
            
            {/* Header Skeleton */}
            <div className="flex justify-between items-center gap-4 mb-6 lg:mb-8">
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl animate-pulse"></div>
                <div>
                  <div className="w-40 h-8 bg-zinc-800 rounded-lg mb-1 animate-pulse"></div>
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
    </div>
  );
}