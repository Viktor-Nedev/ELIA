"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { sustainabilityService } from "@/lib/sustainability.service";
import { DailyEntry } from "@/lib/types";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { 
  ArrowLeft, TrendingUp, Calendar, Filter, Home, 
  TargetIcon, BarChart3, Users, Award, Settings, LogOut,
  Menu, X, Zap, Droplet, Flame, Recycle, Utensils,
  ChevronDown, ChevronUp, Download, RefreshCw,
  Leaf, Globe, Activity, Target, Clock
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<keyof DailyEntry["emissions"]>("co2");
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '14d' | '30d'>('14d');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const filters: { id: keyof DailyEntry["emissions"], label: string, color: string, icon: any }[] = [
    { id: "co2", label: "CO₂ Impact", color: "#f59e0b", icon: <Flame size={16} /> },
    { id: "water", label: "Water Savings", color: "#06b6d4", icon: <Droplet size={16} /> },
    { id: "energy", label: "Energy Flow", color: "#eab308", icon: <Zap size={16} /> },
    { id: "waste", label: "Waste Reduction", color: "#71717a", icon: <Recycle size={16} /> },
    { id: "food", label: "Food Score", color: "#10b981", icon: <Utensils size={16} /> }
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, timeRange]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await sustainabilityService.getRecentEntries(user.uid);
      
      // Filter by time range
      let days;
      switch(timeRange) {
        case '1d': days = 1; break;
        case '7d': days = 7; break;
        case '14d': days = 14; break;
        case '30d': days = 30; break;
        default: days = 14;
      }
      
      const filteredData = data.slice(0, days).reverse();
      
      setEntries(filteredData);
    } catch (err) {
      console.error("Analytics Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = entries.map(e => ({
    date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    co2: e.emissions.co2,
    water: e.emissions.water,
    energy: e.emissions.energy,
    waste: e.emissions.waste,
    food: e.emissions.food,
    points: e.points
  }));

  // Calculate averages
  const averages = {
    co2: entries.reduce((sum, e) => sum + e.emissions.co2, 0) / entries.length || 0,
    water: entries.reduce((sum, e) => sum + e.emissions.water, 0) / entries.length || 0,
    energy: entries.reduce((sum, e) => sum + e.emissions.energy, 0) / entries.length || 0,
    waste: entries.reduce((sum, e) => sum + e.emissions.waste, 0) / entries.length || 0,
    food: entries.reduce((sum, e) => sum + e.emissions.food, 0) / entries.length || 0,
    points: entries.reduce((sum, e) => sum + e.points, 0) / entries.length || 0,
  };

  // Calculate trends
  const calculateTrend = (metric: keyof DailyEntry["emissions"]) => {
    if (entries.length < 2) return 0;
    const first = entries[0].emissions[metric];
    const last = entries[entries.length - 1].emissions[metric];
    return ((last - first) / first) * 100;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <ChevronUp className="w-4 h-4 text-emerald-400" />;
    if (trend < -5) return <ChevronDown className="w-4 h-4 text-red-400" />;
    return <Activity className="w-4 h-4 text-zinc-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-100">
        <div className="flex">
          {/* Skeleton Sidebar */}
          <div className="hidden lg:flex w-64 flex-col bg-zinc-900/80 border-r border-zinc-800/50 p-6">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-full h-12 bg-zinc-800 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        </div>
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
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white uppercase italic">
                    Eco<span className="text-emerald-500">Tracker</span>
                  </h1>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Analytics</p>
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
                  icon={<Target size={20} />} 
                  label="AI Journal" 
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
                  href="/achievements" 
                  icon={<Award size={20} />} 
                  label="Achievements" 
                  active={activeTab === 'achievements'}
                  onClick={() => setActiveTab('achievements')}
                />
              </div>
            </nav>

            {/* Bottom Actions */}
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
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white uppercase italic">
                      Eco<span className="text-emerald-500">Tracker</span>
                    </h1>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Analytics</p>
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
                      icon={<Target size={20} />} 
                      label="AI Journal" 
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
                      href="/achievements" 
                      icon={<Award size={20} />} 
                      label="Achievements" 
                      active={activeTab === 'achievements'}
                      onClick={() => { setActiveTab('achievements'); setSidebarOpen(false); }}
                    />
                  </div>
                </nav>
                
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
            
            {/* Header */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center gap-4 mb-6 lg:mb-8"
            >
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                  <BarChart3 size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                    Impact <span className="text-emerald-500">Analytics</span>
                  </h1>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Environmental Metrics Dashboard</p>
                </div>
              </div>

              <div className="lg:hidden">
                <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
                  Impact <span className="text-emerald-500">Analytics</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Metrics Dashboard</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadData}
                  className="p-3 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl hover:border-emerald-500/30 transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </motion.header>

            <main className="space-y-6 lg:space-y-8 pb-20">
              
              {/* Time Range & Filter Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 backdrop-blur-xl border border-emerald-800/30 rounded-2xl p-6"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} className="text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Performance Dashboard</h2>
                        <p className="text-sm text-emerald-400">Real-time environmental impact tracking</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm text-zinc-300">Live Data</span>
                      </div>
                      <div className="w-[1px] h-4 bg-zinc-800"></div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-zinc-500" />
                        <span className="text-sm text-zinc-300">{entries.length} days tracked</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 w-full lg:w-auto">
                    {/* Time Range Filter */}
                    <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-1">
                      <div className="grid grid-cols-4 gap-1">
                        {(['1d', '7d', '14d', '30d'] as const).map(range => (
                          <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                              timeRange === range 
                                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg' 
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                          >
                            {range === '1d' ? (
                              <>
                                <Clock size={12} />
                                <span className="text-xs">24h</span>
                              </>
                            ) : range === '7d' ? (
                              '1 Week'
                            ) : range === '14d' ? (
                              '2 Weeks'
                            ) : '1 Month'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Metric Filter */}
                    <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-1">
                      <div className="grid grid-cols-5 gap-1">
                        {filters.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all group ${
                              filter === f.id 
                                ? 'bg-gradient-to-b from-zinc-800 to-zinc-900 border border-emerald-500/30 shadow-lg' 
                                : 'hover:bg-zinc-800/30'
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${
                              filter === f.id 
                                ? 'bg-gradient-to-br from-emerald-500 to-blue-500' 
                                : 'bg-zinc-800 group-hover:bg-emerald-500/20'
                            }`}>
                              {f.icon}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              filter === f.id ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                            }`}>
                              {f.label.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Main Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Left Column - Main Chart */}
                <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                  
                  {/* Line Chart */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 lg:p-8"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{filters.find(f => f.id === filter)?.label} Trend</h3>
                        <p className="text-sm text-zinc-400">Daily progression over selected period</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter size={16} className="text-emerald-400" />
                        <span className="text-xs text-zinc-400">{timeRange.toUpperCase()} View</span>
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={filters.find(f => f.id === filter)?.color} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={filters.find(f => f.id === filter)?.color} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#71717a" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(9, 9, 11, 0.95)', 
                              borderColor: '#27272a',
                              borderRadius: '12px',
                              color: 'white'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={filter} 
                            stroke={filters.find(f => f.id === filter)?.color} 
                            strokeWidth={3}
                            fill="url(#colorValue)"
                            dot={{ stroke: filters.find(f => f.id === filter)?.color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Bar Chart - All Metrics */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 lg:p-8"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Comparative Impact</h3>
                        <p className="text-sm text-zinc-400">All metrics side by side</p>
                      </div>
                      <button
                        onClick={() => setShowAllMetrics(!showAllMetrics)}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {showAllMetrics ? 'Show Less' : 'Show All'}
                      </button>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={showAllMetrics ? chartData : chartData.slice(-7)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#71717a" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(9, 9, 11, 0.95)', 
                              borderColor: '#27272a',
                              borderRadius: '12px',
                              color: 'white'
                            }}
                          />
                          <Legend />
                          {filters.map((f, idx) => (
                            <Bar 
                              key={f.id}
                              dataKey={f.id}
                              fill={f.color}
                              radius={[4, 4, 0, 0]}
                              opacity={0.8}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column - Stats & Details */}
                <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                  
                  {/* Key Metrics */}
                  <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Key Metrics</h3>
                    <div className="space-y-4">
                      {filters.map(f => {
                        const trend = calculateTrend(f.id);
                        return (
                          <div key={f.id} className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30 hover:border-emerald-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${f.color}20` }}>
                                  {f.icon}
                                </div>
                                <span className="text-sm font-medium text-zinc-300">{f.label}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getTrendIcon(trend)}
                                <span className={`text-xs font-bold ${trend > 5 ? 'text-emerald-400' : trend < -5 ? 'text-red-400' : 'text-zinc-400'}`}>
                                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-2xl font-black text-white">{averages[f.id].toFixed(1)}</p>
                                <p className="text-xs text-zinc-500">Avg per day</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-zinc-300">
                                  {f.id === 'co2' ? 'kg' : f.id === 'water' ? 'L' : f.id === 'energy' ? 'kWh' : f.id === 'waste' ? 'kg' : '/10'}
                                </p>
                                <p className="text-xs text-zinc-500">Units</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Performance Score */}
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
                        <h3 className="text-lg font-bold text-white">Performance Score</h3>
                        <p className="text-sm text-emerald-400">Overall efficiency</p>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <div className="inline-block relative">
                        <div className="w-32 h-32 rounded-full border-8 border-zinc-800 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-black text-white">{Math.round(averages.points * 10)}</p>
                            <p className="text-xs text-zinc-500">/100</p>
                          </div>
                        </div>
                        <div 
                          className="absolute inset-0 rounded-full border-8 border-transparent border-t-emerald-500 border-r-blue-500"
                          style={{ transform: 'rotate(45deg)' }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Consistency</span>
                        <span className="text-sm font-bold text-emerald-400">High</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Improvement</span>
                        <span className="text-sm font-bold text-emerald-400">+18%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Streak</span>
                        <span className="text-sm font-bold text-orange-400">7 days</span>
                      </div>
                    </div>
                  </motion.div>

                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
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