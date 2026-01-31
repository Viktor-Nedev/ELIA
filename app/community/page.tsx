"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Users, Zap, Target, Flame, Crown, TrendingUp, 
  Search, Filter, Globe, Shield, Star, MessageCircle,
  ThumbsUp, Share2, MoreVertical, Calendar, Hash, Award,
  ChevronUp, ChevronDown, Eye, Users as UsersIcon, Leaf,
  Droplets, Cloud, Recycle, Battery, ArrowLeft, ChevronRight,
  X, Lock, Unlock, Copy, Check, Hash as HashIcon, Tag,
  Globe as GlobeIcon, UserPlus, EyeOff, Eye as EyeIcon,
  Settings, Link as LinkIcon, QrCode, Key
} from "lucide-react";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"leaderboards" | "squads" | "feed">("leaderboards");
  const [leaderboardType, setLeaderboardType] = useState<"global" | "weekly" | "monthly" | "friends">("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showJoinSquad, setShowJoinSquad] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2">Community</h1>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
                Synchronize with global operatives • Compete • Collaborate • Conquer
              </p>
            </div>
            
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex flex-wrap gap-4 border-b border-zinc-800 pb-6 mb-8">
          <TabButton 
            active={activeTab === "leaderboards"} 
            onClick={() => setActiveTab("leaderboards")}
            label="Leaderboards" 
            icon={<Trophy className="w-5 h-5" />}
          />
          <TabButton 
            active={activeTab === "squads"} 
            onClick={() => setActiveTab("squads")}
            label="Squads" 
            icon={<UsersIcon className="w-5 h-5" />}
          />
          <TabButton 
            active={activeTab === "feed"} 
            onClick={() => setActiveTab("feed")}
            label="Community Feed" 
            icon={<MessageCircle className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "squads" && (
            <motion.div
              key="squads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Your Squads */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                  <h3 className="text-xl font-black text-white italic uppercase mb-6 flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-500" /> Your Squads
                  </h3>
                  
                  <div className="space-y-4">
                    <SquadSkeleton />
                    <SquadSkeleton />
                  </div>
                </div>

                {/* Top Squads */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                  <h3 className="text-xl font-black text-white italic uppercase mb-6 flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-500" /> Top Squads
                  </h3>
                  
                  <div className="space-y-4">
                    <TopSquadSkeleton />
                    <TopSquadSkeleton />
                    <TopSquadSkeleton />
                  </div>
                </div>
              </div>

              {/* Create/Join Squad */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">
                  Squad Operations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => setShowCreateSquad(true)}
                    className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                        <Users className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-white group-hover:text-emerald-400 transition-colors">Create Squad</p>
                        <p className="text-xs text-zinc-600">Start your own operative team</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-700 uppercase font-black tracking-widest">
                      <ChevronRight className="w-3 h-3" /> Initialize Formation Protocol
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setShowJoinSquad(true)}
                    className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                        <Hash className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-white group-hover:text-blue-400 transition-colors">Join Squad</p>
                        <p className="text-xs text-zinc-600">Enter squad code to join</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-700 uppercase font-black tracking-widest">
                      <ChevronRight className="w-3 h-3" /> Access with Encrypted Code
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Други табове остават същите... */}
          {activeTab === "leaderboards" && (
            <motion.div
              key="leaderboards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Leaderboard Controls */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex flex-wrap gap-4">
                    <FilterButton 
                      active={leaderboardType === "global"} 
                      onClick={() => setLeaderboardType("global")}
                      label="Global" 
                      icon={<Globe className="w-4 h-4" />}
                    />
                    <FilterButton 
                      active={leaderboardType === "weekly"} 
                      onClick={() => setLeaderboardType("weekly")}
                      label="Weekly" 
                      icon={<TrendingUp className="w-4 h-4" />}
                    />
                    <FilterButton 
                      active={leaderboardType === "monthly"} 
                      onClick={() => setLeaderboardType("monthly")}
                      label="Monthly" 
                      icon={<Calendar className="w-4 h-4" />}
                    />
                    <FilterButton 
                      active={leaderboardType === "friends"} 
                      onClick={() => setLeaderboardType("friends")}
                      label="Friends" 
                      icon={<Users className="w-4 h-4" />}
                    />
                  </div>
                  
                  <div className="relative w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search operatives..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold placeholder-zinc-700 outline-none focus:border-emerald-500/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                  </div>
                </div>
              </div>

              {/* Leaderboard Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Leaderboard */}
                <div className="lg:col-span-2">
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        {leaderboardType.toUpperCase()} RANKINGS
                      </h3>
                      <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">
                        Loading operatives...
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Top 3 Podium Skeleton */}
                      <div className="grid grid-cols-3 gap-4 mb-8">
                        <PodiumSkeleton position={1} />
                        <PodiumSkeleton position={2} />
                        <PodiumSkeleton position={3} />
                      </div>

                      {/* Leaderboard Rows Skeleton */}
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((item) => (
                          <LeaderboardRowSkeleton key={item} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats & Achievements Sidebar */}
                <div className="space-y-8">
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                    <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Your Position
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-black text-emerald-400">#--</span>
                          <div>
                            <p className="font-black text-white">Your Rank</p>
                            <p className="text-xs text-zinc-600">Global percentile: Loading...</p>
                          </div>
                        </div>
                        <Zap className="w-6 h-6 text-yellow-500" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <StatCardSkeleton label="Total Points" />
                        <StatCardSkeleton label="Weekly Gain" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                    <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Award className="w-4 h-4" /> Top Achievements
                    </h4>
                    <div className="space-y-4">
                      <AchievementSkeleton />
                      <AchievementSkeleton />
                      <AchievementSkeleton />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Feed Header */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search community posts..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold placeholder-zinc-700 outline-none focus:border-emerald-500/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                  </div>
                  
                  <button className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-black uppercase tracking-widest">
                    Create Post
                  </button>
                </div>
              </div>

              {/* Community Posts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <CommunityPostSkeleton />
                  <CommunityPostSkeleton />
                  <CommunityPostSkeleton />
                </div>

                {/* Trending Topics */}
                <div className="space-y-8">
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                    <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Flame className="w-4 h-4" /> Trending Topics
                    </h4>
                    <div className="space-y-4">
                      <TrendingTopicSkeleton />
                      <TrendingTopicSkeleton />
                      <TrendingTopicSkeleton />
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                    <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">
                      Active Now
                    </h4>
                    <div className="flex -space-x-3 mb-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 animate-pulse"></div>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600">
                      Loading active operatives...
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Squad Modal */}
      <AnimatePresence>
        {showCreateSquad && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateSquad(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Users className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Squad Formation</h3>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] ml-1">Initialize New Operative Team</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCreateSquad(false)}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8">
                {/* Squad Name */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Squad Designation
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter squad name..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white font-black placeholder-zinc-700 hover:border-zinc-700 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>

                {/* Squad Description */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Settings className="w-3 h-3" /> Mission Statement
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Describe your squad's mission and goals..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white font-black placeholder-zinc-700 hover:border-zinc-700 focus:border-emerald-500 transition-all outline-none resize-none"
                  />
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Security Protocol
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-6 border rounded-2xl cursor-pointer transition-all hover:border-emerald-500/50 group`}>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                          <GlobeIcon className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-black text-white">Public Squad</p>
                          <p className="text-xs text-zinc-600">Visible to all operatives</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400 uppercase font-black tracking-widest">
                        <UserPlus className="w-3 h-3" /> Open Recruitment
                      </div>
                    </div>

                    <div className={`p-6 border rounded-2xl cursor-pointer transition-all hover:border-blue-500/50 group`}>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                          <Lock className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-black text-white">Private Squad</p>
                          <p className="text-xs text-zinc-600">Invite-only access</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-blue-400 uppercase font-black tracking-widest">
                        <Key className="w-3 h-3" /> Encrypted Access
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invite Friends */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <UserPlus className="w-3 h-3" /> Initial Operatives
                  </label>
                  <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
                    <p className="text-sm text-zinc-500 font-bold mb-4">Select initial squad members (optional)</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-2 bg-zinc-900 rounded-xl flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20"></div>
                        <span className="text-xs font-black">Operative_Alpha</span>
                        <X className="w-3 h-3 text-zinc-600" />
                      </div>
                      <div className="px-4 py-2 bg-zinc-900 rounded-xl flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20"></div>
                        <span className="text-xs font-black">Eco_Warrior</span>
                        <X className="w-3 h-3 text-zinc-600" />
                      </div>
                      <button className="px-4 py-2 border border-dashed border-zinc-800 rounded-xl text-zinc-600 hover:text-zinc-400 transition-colors text-xs font-black">
                        + Add Operative
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-black/40 border-t border-zinc-800">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowCreateSquad(false)}
                    className="flex-1 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-600 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                  >
                    Abort Mission
                  </button>
                  <button 
                    className="flex-[2] py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3"
                  >
                    <Users className="w-4 h-4" /> Initialize Squad
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Squad Modal */}
      <AnimatePresence>
        {showJoinSquad && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJoinSquad(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <Key className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Squad Access</h3>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] ml-1">Encrypted Code Authentication</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowJoinSquad(false)}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8">
                {/* Squad Code Input */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <HashIcon className="w-3 h-3" /> Access Code
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Enter 8-character squad code..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white font-black placeholder-zinc-700 hover:border-zinc-700 focus:border-blue-500 transition-all outline-none text-center tracking-widest"
                      maxLength={8}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <QrCode className="w-5 h-5 text-zinc-700" />
                    </div>
                  </div>
                  <p className="text-center text-xs text-zinc-600 mt-2">
                    Get the code from your squad leader or scan QR code
                  </p>
                </div>

                {/* Code Examples */}
                <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Copy className="w-3 h-3" /> Example Codes
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-zinc-900 rounded-xl">
                      <p className="text-xs text-zinc-600 font-black uppercase tracking-widest mb-1">Eco Warriors</p>
                      <p className="font-mono text-sm text-emerald-400 font-black">ECO7X9B2</p>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-xl">
                      <p className="text-xs text-zinc-600 font-black uppercase tracking-widest mb-1">Green Team</p>
                      <p className="font-mono text-sm text-blue-400 font-black">GR33N42A</p>
                    </div>
                  </div>
                </div>

                {/* How to Get Code */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-3 h-3" /> Acquisition Methods
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-zinc-950/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">From Squad Leader</p>
                        <p className="text-xs text-zinc-600">Request code from operative in charge</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-zinc-950/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <QrCode className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">QR Code Scan</p>
                        <p className="text-xs text-zinc-600">Scan squad invitation QR</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-zinc-950/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <LinkIcon className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">Direct Link</p>
                        <p className="text-xs text-zinc-600">Click squad invitation link</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-black/40 border-t border-zinc-800">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowJoinSquad(false)}
                    className="flex-1 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-600 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                  >
                    Cancel Access
                  </button>
                  <button 
                    className="flex-[2] py-5 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3"
                  >
                    <Key className="w-4 h-4" /> Authenticate & Join
                  </button>
                </div>
                
                <div className="mt-6 p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <EyeOff className="w-4 h-4 text-amber-500" />
                    <p className="text-xs text-zinc-600 font-bold">
                      Note: Squad codes are encrypted and change every 24 hours for security
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components (остават същите като преди)
function TabButton({ active, onClick, label, icon }: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all relative ${active ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-zinc-900/40 border border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
    >
      {icon}
      <span className="text-sm font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function FilterButton({ active, onClick, label, icon }: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl flex items-center gap-2 transition-all ${active ? 'bg-emerald-500 text-white' : 'bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
    >
      {icon}
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

// Skeleton Components (остават същите като преди)
function PodiumSkeleton({ position }: { position: number }) {
  const height = position === 1 ? "h-48" : position === 2 ? "h-40" : "h-36";
  
  return (
    <div className={`relative ${height} bg-gradient-to-b from-zinc-900/20 to-zinc-900/5 border border-zinc-800 rounded-[2rem] p-6 flex flex-col items-center justify-end animate-pulse`}>
      <div className="absolute -top-6 w-14 h-14 rounded-full bg-zinc-800 border-4 border-zinc-900"></div>
      
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-zinc-800 rounded"></div>
          <span className="text-2xl font-black text-zinc-800">#{position}</span>
        </div>
        <div className="h-4 bg-zinc-800 rounded w-24 mx-auto mb-1"></div>
        <div className="h-3 bg-zinc-900 rounded w-16 mx-auto"></div>
      </div>
    </div>
  );
}

function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-sm font-black text-zinc-900">#</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800"></div>
          
          <div>
            <div className="h-4 bg-zinc-800 rounded w-24 mb-1"></div>
            <div className="h-3 bg-zinc-900 rounded w-16"></div>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="h-6 bg-zinc-800 rounded w-16 mb-1"></div>
        <div className="h-3 bg-zinc-900 rounded w-10 ml-auto"></div>
      </div>
    </div>
  );
}

function StatCardSkeleton({ label }: { label: string }) {
  return (
    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-600 uppercase tracking-widest">{label}</span>
        <div className="p-2 rounded-lg bg-zinc-800">
          <div className="w-4 h-4 bg-zinc-900 rounded"></div>
        </div>
      </div>
      <div className="h-8 bg-zinc-800 rounded w-full"></div>
    </div>
  );
}

function AchievementSkeleton() {
  return (
    <div className="p-4 border border-zinc-800 bg-zinc-950/50 rounded-2xl animate-pulse">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-zinc-800">
          <div className="w-4 h-4 bg-zinc-900 rounded"></div>
        </div>
        <div className="flex-1">
          <div className="h-4 bg-zinc-800 rounded w-32 mb-1"></div>
          <div className="h-3 bg-zinc-900 rounded w-24"></div>
        </div>
        <div className="w-5 h-5 bg-zinc-800 rounded"></div>
      </div>
    </div>
  );
}

function SquadSkeleton() {
  return (
    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800"></div>
          <div>
            <div className="h-4 bg-zinc-800 rounded w-24 mb-1"></div>
            <div className="h-3 bg-zinc-900 rounded w-32"></div>
          </div>
        </div>
        <div className="px-3 py-1 bg-zinc-900 rounded-lg w-16 h-6"></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800"></div>
          ))}
        </div>
        
        <div className="px-4 py-2 bg-zinc-800 rounded-xl w-16 h-8"></div>
      </div>
    </div>
  );
}

function TopSquadSkeleton() {
  return (
    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl animate-pulse">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-zinc-800"></div>
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-zinc-900 border border-zinc-800 rounded-lg"></div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-zinc-800 rounded w-20"></div>
            <div className="h-4 bg-zinc-800 rounded w-12"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-3 bg-zinc-900 rounded w-16"></div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-zinc-800 rounded"></div>
              <div className="h-3 bg-zinc-900 rounded w-12"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityPostSkeleton() {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-800"></div>
          
          <div>
            <div className="h-4 bg-zinc-800 rounded w-24 mb-1"></div>
            <div className="h-3 bg-zinc-900 rounded w-16"></div>
          </div>
        </div>
        
        <div className="p-2">
          <div className="w-5 h-5 bg-zinc-800 rounded"></div>
        </div>
      </div>
      
      <div className="space-y-2 mb-6">
        <div className="h-4 bg-zinc-800 rounded w-full"></div>
        <div className="h-4 bg-zinc-800 rounded w-4/5"></div>
        <div className="h-4 bg-zinc-800 rounded w-3/5"></div>
      </div>
      
      <div className="mb-6 p-4 bg-zinc-950/50 rounded-2xl">
        <div className="h-4 bg-zinc-800 rounded w-32 mb-3"></div>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-3 py-2 bg-zinc-900 rounded-xl w-24 h-10"></div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-800 rounded"></div>
            <div className="h-4 bg-zinc-800 rounded w-6"></div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-800 rounded"></div>
            <div className="h-4 bg-zinc-800 rounded w-6"></div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-zinc-800 rounded"></div>
          <div className="h-4 bg-zinc-800 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}

function TrendingTopicSkeleton() {
  return (
    <div className="p-3 bg-zinc-950/50 rounded-2xl animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-zinc-800 rounded"></div>
          <div className="h-4 bg-zinc-800 rounded w-32"></div>
        </div>
        <div className="h-3 bg-zinc-900 rounded w-10"></div>
      </div>
    </div>
  );
}