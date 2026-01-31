"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { sustainabilityService } from "@/lib/sustainability.service";
import { DailyEntry } from "@/lib/types";
import { 
  ArrowLeft, BookOpen, Zap, Droplets, Leaf, Flame, Recycle, 
  Filter, TrendingUp, Calendar, ChevronDown, ChevronUp,
  Trophy, Star, Award, Target, BarChart3, Home, Users,
  Sparkles, MessageSquare, Brain, Clock, Hash, SortAsc, SortDesc,
  Menu, X, Settings, LogOut, TargetIcon, Award as AwardIcon
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type SortOption = 'date' | 'points' | 'co2' | 'water' | 'food' | 'energy';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'energy' | 'transportation' | 'water' | 'food' | 'waste' | 'withComments';

export default function HistoryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalCO2: 0,
    totalWater: 0,
    streak: 0,
    daysLogged: 0
  });

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await sustainabilityService.getRecentEntries(user.uid, 100);
      setEntries(data);
      
      const totalPoints = data.reduce((sum, entry) => sum + entry.points, 0);
      const totalCO2 = data.reduce((sum, entry) => sum + entry.emissions.co2, 0);
      const totalWater = data.reduce((sum, entry) => sum + entry.emissions.water, 0);
      const daysLogged = data.length;
      
      const streak = calculateStreak(data);
      
      setStats({ totalPoints, totalCO2, totalWater, streak, daysLogged });
    } catch (err) {
      console.error("History Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (entries: DailyEntry[]): number => {
    if (entries.length === 0) return 0;
    
    const sorted = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sorted.length; i++) {
      const entryDate = new Date(sorted[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - entryDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      
      if (diffDays === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = [...entries];
    
    if (filterType !== 'all') {
      if (filterType === 'withComments') {
        filtered = filtered.filter(entry => entry.aiComment && entry.aiComment.trim().length > 0);
      } else {
        filtered = filtered.filter(entry => {
          const emissions = entry.emissions;
          
          switch (filterType) {
            case 'energy':
              return (emissions.energy || 0) > 0;
            case 'transportation':
              return emissions.co2 > 0;
            case 'water':
              return emissions.water > 0;
            case 'food':
              return emissions.food > 0;
            case 'waste':
              return (emissions.waste || 0) > 0;
            default:
              return true;
          }
        });
      }
    }
    
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'points':
          valueA = a.points;
          valueB = b.points;
          break;
        case 'co2':
          valueA = a.emissions.co2;
          valueB = b.emissions.co2;
          break;
        case 'water':
          valueA = a.emissions.water;
          valueB = b.emissions.water;
          break;
        case 'food':
          valueA = a.emissions.food;
          valueB = b.emissions.food;
          break;
        case 'energy':
          valueA = a.emissions.energy || 0;
          valueB = b.emissions.energy || 0;
          break;
        case 'date':
        default:
          valueA = new Date(a.date).getTime();
          valueB = new Date(b.date).getTime();
      }
      
      if (sortDirection === 'desc') {
        return valueB - valueA;
      }
      return valueA - valueB;
    });
    
    return filtered;
  }, [entries, sortBy, sortDirection, filterType]);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  const getBadgeForPoints = (points: number) => {
    if (points >= 100) return { icon: <Trophy className="w-4 h-4" />, label: 'Eco Champion', color: 'text-yellow-500 bg-yellow-500/10' };
    if (points >= 75) return { icon: <Award className="w-4 h-4" />, label: 'Eco Hero', color: 'text-purple-500 bg-purple-500/10' };
    if (points >= 50) return { icon: <Star className="w-4 h-4" />, label: 'Eco Warrior', color: 'text-blue-500 bg-blue-500/10' };
    if (points >= 25) return { icon: <Target className="w-4 h-4" />, label: 'Eco Explorer', color: 'text-emerald-500 bg-emerald-500/10' };
    return { icon: <Sparkles className="w-4 h-4" />, label: 'Eco Starter', color: 'text-zinc-500 bg-zinc-500/10' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-t-emerald-500 border-zinc-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="flex min-h-screen">
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex w-64 flex-col bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800/50">
          <div className="flex flex-col h-full p-6">
            {/* Sidebar Logo */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                  <Brain size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white uppercase italic">
                    Eco<span className="text-emerald-500">Tracker</span>
                  </h1>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Mission History</p>
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
                  icon={<MessageSquare size={20} />} 
                  label="AI Journal" 
                  active={activeTab === 'journal'}
                  onClick={() => setActiveTab('journal')}
                />
                <NavItem 
                  href="/history" 
                  icon={<BarChart3 size={20} />} 
                  label="History" 
                  active={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
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
                  icon={<AwardIcon size={20} />} 
                  label="Achievements" 
                  active={activeTab === 'achievements'}
                  onClick={() => setActiveTab('achievements')}
                />
                <NavItem 
                  href="/friends" 
                  icon={<Users size={20} />} 
                  label="Friends" 
                  active={activeTab === 'friends'}
                  onClick={() => setActiveTab('friends')}
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
                    <Brain size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white uppercase italic">
                      Eco<span className="text-emerald-500">Tracker</span>
                    </h1>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Mission History</p>
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
                      icon={<MessageSquare size={20} />} 
                      label="AI Journal" 
                      active={activeTab === 'journal'}
                      onClick={() => { setActiveTab('journal'); setSidebarOpen(false); }}
                    />
                    <NavItem 
                      href="/history" 
                      icon={<BarChart3 size={20} />} 
                      label="History" 
                      active={activeTab === 'history'}
                      onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
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
                      icon={<AwardIcon size={20} />} 
                      label="Achievements" 
                      active={activeTab === 'achievements'}
                      onClick={() => { setActiveTab('achievements'); setSidebarOpen(false); }}
                    />
                    <NavItem 
                      href="/friends" 
                      icon={<Users size={20} />} 
                      label="Friends" 
                      active={activeTab === 'friends'}
                      onClick={() => { setActiveTab('friends'); setSidebarOpen(false); }}
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
          <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                    <BarChart3 size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter">
                      Mission <span className="text-emerald-500">History</span>
                    </h1>
                    <p className="text-zinc-500 font-medium">Archived logs of your environmental operations.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Total Points" value={stats.totalPoints.toString()} color="text-emerald-400" />
                <StatCard icon={<Flame className="w-4 h-4" />} label="CO₂ Saved" value={`${stats.totalCO2}kg`} color="text-orange-400" />
                <StatCard icon={<Droplets className="w-4 h-4" />} label="Water Saved" value={`${stats.totalWater}L`} color="text-blue-400" />
                <StatCard icon={<Hash className="w-4 h-4" />} label="Day Streak" value={stats.streak.toString()} color="text-purple-400" />
                <StatCard icon={<Calendar className="w-4 h-4" />} label="Days Logged" value={stats.daysLogged.toString()} color="text-cyan-400" />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-8 p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl">
              <div className="flex-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">Filter by Emission Type</h3>
                <div className="flex flex-wrap gap-2">
                  <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')}>
                    All Activities
                  </FilterButton>
                  <FilterButton active={filterType === 'energy'} onClick={() => setFilterType('energy')}>
                    <Zap className="w-3 h-3" /> Energy
                  </FilterButton>
                  <FilterButton active={filterType === 'transportation'} onClick={() => setFilterType('transportation')}>
                    <Flame className="w-3 h-3" /> Transport
                  </FilterButton>
                  <FilterButton active={filterType === 'water'} onClick={() => setFilterType('water')}>
                    <Droplets className="w-3 h-3" /> Water
                  </FilterButton>
                  <FilterButton active={filterType === 'food'} onClick={() => setFilterType('food')}>
                    <Leaf className="w-3 h-3" /> Food
                  </FilterButton>
                  <FilterButton active={filterType === 'withComments'} onClick={() => setFilterType('withComments')}>
                    <MessageSquare className="w-3 h-3" /> With AI Comments
                  </FilterButton>
                </div>
              </div>
              
              <div className="lg:w-64">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">Sort By</h3>
                <div className="grid grid-cols-3 gap-2">
                  <SortButton 
                    active={sortBy === 'date'} 
                    direction={sortBy === 'date' ? sortDirection : undefined}
                    onClick={() => handleSort('date')}
                  >
                    <Calendar className="w-3 h-3" /> Date
                  </SortButton>
                  <SortButton 
                    active={sortBy === 'points'} 
                    direction={sortBy === 'points' ? sortDirection : undefined}
                    onClick={() => handleSort('points')}
                  >
                    <TrendingUp className="w-3 h-3" /> Points
                  </SortButton>
                  <SortButton 
                    active={sortBy === 'co2'} 
                    direction={sortBy === 'co2' ? sortDirection : undefined}
                    onClick={() => handleSort('co2')}
                  >
                    <Flame className="w-3 h-3" /> CO₂
                  </SortButton>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSortedEntries.length > 0 ? (
                filteredAndSortedEntries.map((entry, idx) => {
                  const badge = getBadgeForPoints(entry.points);
                  const isExpanded = expandedDay === entry.id;
                  
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all group"
                    >
                      <div 
                        className="p-6 cursor-pointer"
                        onClick={() => setExpandedDay(isExpanded ? null : entry.id || null)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700">
                                <p className="text-xs font-black text-white">
                                  {new Date(entry.date).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badge.color}`}>
                                {badge.icon}
                                {badge.label}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <span className="text-xs font-black text-emerald-400">+{entry.points} PTS</span>
                              </div>
                              <span className="text-xs text-zinc-500 font-medium">
                                {new Date(entry.date).getFullYear()}
                              </span>
                            </div>
                          </div>
                          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-zinc-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <MiniStat 
                            icon={<Flame className="w-3 h-3 text-orange-400" />} 
                            label="CO₂" 
                            value={`${entry.emissions.co2}kg`}
                            impact={entry.emissions.co2 > 5 ? 'high' : entry.emissions.co2 > 2 ? 'medium' : 'low'}
                          />
                          <MiniStat 
                            icon={<Droplets className="w-3 h-3 text-blue-400" />} 
                            label="Water" 
                            value={`${entry.emissions.water}L`}
                            impact={entry.emissions.water > 50 ? 'high' : entry.emissions.water > 20 ? 'medium' : 'low'}
                          />
                          <MiniStat 
                            icon={<Leaf className="w-3 h-3 text-emerald-400" />} 
                            label="Food" 
                            value={`${entry.emissions.food}/10`}
                            impact={entry.emissions.food > 7 ? 'high' : entry.emissions.food > 4 ? 'medium' : 'low'}
                          />
                          <MiniStat 
                            icon={<Zap className="w-3 h-3 text-yellow-400" />} 
                            label="Energy" 
                            value={`${entry.emissions.energy || 0}kWh`}
                            impact={(entry.emissions.energy || 0) > 10 ? 'high' : (entry.emissions.energy || 0) > 5 ? 'medium' : 'low'}
                          />
                        </div>

                        {entry.aiComment && (
                          <div className="p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Brain className="w-3 h-3 text-emerald-400" />
                              <span className="text-xs font-bold text-emerald-400">AI Comment</span>
                            </div>
                            <p className="text-sm text-zinc-300 italic line-clamp-2">"{entry.aiComment}"</p>
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-zinc-800"
                          >
                            <div className="p-6 space-y-4">
                              {entry.rawText && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Original Entry</h4>
                                  <p className="text-sm text-zinc-300 bg-zinc-800/20 p-3 rounded-lg border border-zinc-700/30">
                                    {entry.rawText}
                                  </p>
                                </div>
                              )}

                              {entry.aiComment && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Full AI Analysis</h4>
                                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Sparkles className="w-4 h-4 text-emerald-400" />
                                      <span className="text-sm font-bold text-emerald-400">Eco AI Insight</span>
                                    </div>
                                    <p className="text-sm text-zinc-300">"{entry.aiComment}"</p>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Impact Breakdown</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {Object.entries(entry.emissions).map(([key, value]) => {
                                    if (typeof value === 'number' && value > 0) {
                                      return (
                                        <div key={key} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg">
                                          <span className="text-xs text-zinc-400 capitalize">{key}</span>
                                          <span className="text-sm font-bold text-white">{value}</span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              </div>

                              {entry.actions && entry.actions.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Actions Taken</h4>
                                  <div className="space-y-2">
                                    {entry.actions.map((action: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-800/20 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm text-zinc-300">{action}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  <span className="text-xs text-zinc-500">Logged at</span>
                                </div>
                                <span className="text-xs font-medium text-zinc-400">
                                  {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center space-y-4 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-[2rem]">
                  <BookOpen className="w-16 h-16 text-zinc-800 mx-auto" />
                  <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">
                    {filterType !== 'all' ? 'No entries match your filter' : 'Deployment history empty.'}
                  </p>
                  <p className="text-zinc-700 text-sm max-w-md mx-auto">
                    Start your sustainability journey by logging your first entry in the AI Journal.
                  </p>
                  <Link 
                    href="/journal" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Go to Journal
                  </Link>
                </div>
              )}
            </div>

            {filteredAndSortedEntries.length > 0 && (
              <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <p className="font-medium">
                    Showing <span className="text-white font-bold">{filteredAndSortedEntries.length}</span> of{' '}
                    <span className="text-white font-bold">{entries.length}</span> total entries
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500"></div>
                      <span className="text-xs">High Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500"></div>
                      <span className="text-xs">Medium Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500"></div>
                      <span className="text-xs">Low Impact</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function NavItem({ href, icon, label, active, onClick }: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
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

function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
}) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
          {icon}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function FilterButton({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
        active 
          ? 'bg-emerald-500 text-white border border-emerald-500' 
          : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/50'
      }`}
    >
      {children}
    </button>
  );
}

function SortButton({ 
  children, 
  active, 
  direction,
  onClick 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  direction?: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
        active 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/50'
      }`}
    >
      {children}
      {active && direction && (
        direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
      )}
    </button>
  );
}

function MiniStat({ 
  icon, 
  label, 
  value,
  impact 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  impact: 'high' | 'medium' | 'low';
}) {
  const impactColor = {
    high: 'border-emerald-500/30 bg-emerald-500/10',
    medium: 'border-yellow-500/30 bg-yellow-500/10',
    low: 'border-blue-500/30 bg-blue-500/10'
  };

  return (
    <div className={`p-2 rounded-lg border ${impactColor[impact]} text-center`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-xs font-bold text-zinc-400">{label}</span>
      </div>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  );
}