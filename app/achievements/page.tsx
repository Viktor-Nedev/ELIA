"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { sustainabilityService, ACHIEVEMENTS } from "@/lib/sustainability.service";
import { UserProfile, Achievement } from "@/lib/types";
import { 
  ArrowLeft, Award, Lock, CheckCircle2, Trophy, Star, 
  Sparkles, Zap, Droplets, Flame, Target, TrendingUp,
  Filter, Shield, Medal, Info, PlusCircle
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unlocked" | "locked">("all");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await sustainabilityService.getUserProfile(user.uid);
      setProfile(data);
    } catch (err) {
      console.error("Load Errors:", err);
    } finally {
      setLoading(false);
    }
  };

  const earnedIds = useMemo(() => new Set(profile?.earnedAchievements || []), [profile]);

  const filteredAchievements = useMemo(() => {
    if (activeTab === "unlocked") return ACHIEVEMENTS.filter(a => earnedIds.has(a.id));
    if (activeTab === "locked") return ACHIEVEMENTS.filter(a => !earnedIds.has(a.id));
    return ACHIEVEMENTS;
  }, [activeTab, earnedIds]);

  const stats = useMemo(() => {
    const total = ACHIEVEMENTS.length;
    const unlocked = earnedIds.size;
    const percentage = Math.round((unlocked / total) * 100);
    const totalBonus = ACHIEVEMENTS.filter(a => earnedIds.has(a.id)).reduce((sum, a) => sum + a.pointsBonus, 0);
    
    return { total, unlocked, percentage, totalBonus };
  }, [earnedIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-t-emerald-500 border-zinc-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 pb-20 overflow-hidden relative">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Nexus
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <Trophy size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                  Hall of <span className="text-orange-400 font-black">Achievement</span>
                </h1>
                <p className="text-zinc-500 font-medium">Your permanent record of environmental excellence.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2 text-zinc-500">
                <Medal size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Completion</span>
              </div>
              <p className="text-3xl font-black text-white italic">{stats.percentage}%</p>
              <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percentage}%` }}
                    className="h-full bg-orange-400"
                ></motion.div>
              </div>
            </div>
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2 text-zinc-500">
                <PlusCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Bonus Points</span>
              </div>
              <p className="text-3xl font-black text-emerald-400 italic">+{stats.totalBonus}</p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Earned via milestones</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-8">
            <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All Badges" count={stats.total} />
            <TabButton active={activeTab === 'unlocked'} onClick={() => setActiveTab('unlocked')} label="Unlocked" count={stats.unlocked} />
            <TabButton active={activeTab === 'locked'} onClick={() => setActiveTab('locked')} label="Still Waiting" count={stats.total - stats.unlocked} />
          </div>
          <div className="hidden md:flex items-center gap-2 text-zinc-500 text-xs font-bold bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800">
            <Info size={14} />
            <span>Achievements are awarded automatically based on your daily actions</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAchievements.map((ach) => (
              <AchievementCard 
                key={ach.id} 
                achievement={ach} 
                isLocked={!earnedIds.has(ach.id)} 
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement, isLocked }: { achievement: Achievement, isLocked: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className={`relative group h-full transition-all duration-500`}
    >
      <div className={`h-full bg-zinc-900/40 backdrop-blur-xl border rounded-[2rem] p-8 flex flex-col items-center text-center transition-all duration-500 ${
        isLocked 
          ? 'border-zinc-800 opacity-60 grayscale' 
          : 'border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.03)] group-hover:border-emerald-500/40 group-hover:bg-emerald-500/[0.02]'
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 relative ${
            isLocked ? 'bg-zinc-800' : 'bg-gradient-to-br from-emerald-500/20 to-blue-500/20 shadow-2xl animate-pulse-subtle'
        }`}>
          {achievement.icon}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-full">
              <Lock size={20} className="text-zinc-500" />
            </div>
          )}
        </div>

        <div className="space-y-2 flex-grow">
          <h3 className={`text-xl font-black uppercase tracking-tighter italic ${isLocked ? 'text-zinc-500' : 'text-white'}`}>
            {achievement.name}
          </h3>
          <p className={`text-xs font-medium leading-relaxed ${isLocked ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {isLocked ? "Secure this report to view details." : achievement.description}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800/50 w-full">
          {isLocked ? (
              <div className="flex items-center justify-center gap-2">
                <Target size={12} className="text-zinc-700" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Classification Restricted</span>
              </div>
          ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bonus XP</span>
                    <span className="text-xs font-black text-emerald-400 italic">+{achievement.pointsBonus}</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-500/60 mt-1">
                   <CheckCircle2 size={10} />
                   <span>Operational Success</span>
                </div>
              </div>
          )}
        </div>

        {!isLocked && (
            <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1">
                <Sparkles size={12} className="text-emerald-400" />
            </div>
        )}
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count: number }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
          active ? "text-orange-400" : "text-zinc-600 hover:text-zinc-300"
      }`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-md text-[8px] border transition-all ${
          active ? 'bg-orange-400/10 border-orange-400/20 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
      }`}>
        {count}
      </span>
      {active && (
        <motion.div 
            layoutId="activeTabUnderline" 
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
        />
      )}
    </button>
  );
}
