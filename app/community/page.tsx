"use client";

import { useState, useEffect } from "react";
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
  Settings, Link as LinkIcon, QrCode, Key, Heart, Send,
  ShieldAlert, Radio
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { sustainabilityService } from "@/lib/sustainability.service";
import { ChatMessage, messagingService } from "@/lib/messaging.service";
import { UserProfile, Squad, CommunityPost } from "@/lib/types";
import { useRouter } from "next/navigation";

function formatTimestamp(ts: any) {
  if (!ts) return "Just now";
  // Handle Firestore Timestamp
  if (ts.seconds) {
    return new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Handle JS Date or Number
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"leaderboards" | "squads" | "feed">("leaderboards");
  const [leaderboardType, setLeaderboardType] = useState<"global" | "weekly" | "monthly" | "friends">("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showJoinSquad, setShowJoinSquad] = useState(false);

  // Data State
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [yourSquads, setYourSquads] = useState<Squad[]>([]);
  const [topSquads, setTopSquads] = useState<Squad[]>([]);
  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search State
  const [squadSearchQuery, setSquadSearchQuery] = useState("");
  const [squadSearchResults, setSquadSearchResults] = useState<Squad[]>([]);

  // Form State
  const [newSquadName, setNewSquadName] = useState("");
  const [newSquadDesc, setNewSquadDesc] = useState("");
  const [newSquadPrivate, setNewSquadPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Chat State
  const [activeChatSquadId, setActiveChatSquadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [selectedFeedSquadId, setSelectedFeedSquadId] = useState<string | null>(null);
  const [percentile, setPercentile] = useState(0);

  useEffect(() => {
    if (activeTab === "leaderboards") {
      calculatePercentile();
      loadLeaderboard();
    } else if (activeTab === "squads" && user) {
      loadSquads();
    } else if (activeTab === "feed") {
      loadFeed(selectedFeedSquadId || undefined);
    }
  }, [activeTab, leaderboardType, user, selectedFeedSquadId]);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (squadSearchQuery.trim()) {
        try {
          const results = await sustainabilityService.searchSquads(squadSearchQuery);
          setSquadSearchResults(results);
        } catch (err) {
          console.error("Squad Search Error:", err);
        }
      } else {
        setSquadSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [squadSearchQuery]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const type = leaderboardType === 'monthly' ? 'global' : leaderboardType;
      const data = await sustainabilityService.getLeaderboard(type as any, user?.uid);
      setLeaderboard(data);
    } catch (err) {
      setError("Failed to load leaderboards.");
    } finally {
      setLoading(false);
    }
  };

  const loadSquads = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const squads = await sustainabilityService.getSquads(user.uid);
      setYourSquads(squads);
      
      const top = await sustainabilityService.getTopSquads(5);
      setTopSquads(top);
    } catch (err) {
      setError("Failed to load squads.");
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async (squadId?: string) => {
    try {
      setLoading(true);
      const posts = await sustainabilityService.getCommunityFeed(squadId);
      setFeedPosts(posts);
    } catch (err) {
      setError("Failed to load community feed.");
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentile = async () => {
    if (!user) return;
     const profile = await sustainabilityService.getUserProfile(user.uid);

      // Calculate Percentile
      const allUsers = await sustainabilityService.getLeaderboard('global', user?.uid);
      const myPoints = profile?.totalPoints || 0;
      const countBetter = allUsers.filter(u => (u.totalPoints || 0) > myPoints).length;
      const percentile = Math.max(1, Math.round((countBetter / allUsers.length) * 100));  
      setPercentile(percentile);
  };

  const handleCreateSquad = async () => {
    if (!user || !newSquadName) return;
    try {
      setLoading(true);
      console.log("Creating squad:", {
        name: newSquadName,
        description: newSquadDesc,
        isPrivate: newSquadPrivate
      });
      await sustainabilityService.createSquad(user.uid, {
        name: newSquadName,
        description: newSquadDesc,
        isPrivate: newSquadPrivate
      });
      console.log("Squad created successfully.");
      setShowCreateSquad(false);
      loadSquads();
    } catch (err) {
      setError("Failed to create squad.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSquad = async () => {
    if (!user || !joinCode) return;
    try {
      setLoading(true);
      await sustainabilityService.joinSquad(user.uid, joinCode);
      await loadSquads();
      setShowJoinSquad(false);
      setJoinCode("");
    } catch (err: any) {
      setError(err.message || "Failed to join squad.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithId = async (squadId: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await sustainabilityService.joinSquadById(user.uid, squadId);
      await loadSquads();
      setSquadSearchQuery("");
      setSquadSearchResults([]);
    } catch (err: any) {
      setError(err.message || "Failed to join squad.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;
    try {
      await sustainabilityService.toggleLike(postId, user.uid);
      loadFeed();
    } catch (err) {
      // Silent fail for like
    }
  };

  useEffect(() => {
    if (activeTab === "feed" && yourSquads.length > 0 && !activeChatSquadId) {
      setActiveChatSquadId(yourSquads[0].id!);
    }
  }, [activeTab, yourSquads]);

  useEffect(() => {
    if (!activeChatSquadId || !user) return;

    // Presence
    sustainabilityService.getUserProfile(user.uid).then(profileData => {
      messagingService.updatePresence(activeChatSquadId, user.uid, profileData?.displayName || "Anonymous");
    });
    const unsubscribePresence = messagingService.subscribeToPresence(activeChatSquadId, (users) => {
      setOnlineUsers(users);
    });

    // Messages
    setChatLoading(true);
    const unsubscribeMessages = messagingService.subscribeToMessages(activeChatSquadId, (msgs) => {
      setMessages(msgs);
      setChatLoading(false);
    });

    return () => {
      unsubscribePresence();
      unsubscribeMessages();
    };
  }, [activeChatSquadId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChatSquadId || !newMessage.trim()) return;

    try {
      const profileData = await sustainabilityService.getUserProfile(user.uid);
      await messagingService.sendMessage(
        activeChatSquadId,
        user.uid,
        profileData?.displayName || "Anonymous",
        newMessage
      );
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

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
                    {yourSquads.length > 0 ? (
                      yourSquads.map(squad => (
                        <SquadCard key={squad.id} squad={squad} />
                      ))
                    ) : (
                      <div className="p-8 text-center border border-dashed border-zinc-800 rounded-[2rem]">
                        <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">No Active Formations</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Squad Search (Replacing Top Squads) */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                      <Search className="w-6 h-6 text-blue-500" /> Squad Recon
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Public Directory</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search formations..." 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white placeholder-zinc-700 outline-none focus:border-blue-500/50 transition-all"
                        value={squadSearchQuery}
                        onChange={(e) => setSquadSearchQuery(e.target.value)}
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {squadSearchResults.length > 0 ? (
                        squadSearchResults.map((squad) => (
                          <SquadSearchResultCard key={squad.id} squad={squad} onJoin={() => handleJoinWithId(squad.id!)} />
                        ))
                      ) : squadSearchQuery ? (
                        <div className="py-10 text-center">
                          <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest italic">No matching formations found.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 mb-4">Recommended for You</p>
                          {topSquads.map((squad, i) => (
                             <TopSquadCard key={squad.id} squad={squad} rank={i+1} />
                          ))}
                        </div>
                      )}
                    </div>
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
                        {loading ? "Loading operatives..." : `${leaderboard.length} Active Operatives`}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {loading ? (
                        <>
                          <div className="grid grid-cols-3 gap-4 mb-8">
                            <PodiumSkeleton position={1} />
                            <PodiumSkeleton position={2} />
                            <PodiumSkeleton position={3} />
                          </div>
                          <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((item) => (
                              <LeaderboardRowSkeleton key={item} />
                            ))}
                          </div>
                        </>
                      ) : leaderboard.length > 0 ? (
                        <>
                          {/* Top 3 Podium */}
                          <div className="grid grid-cols-3 gap-4 mb-12 items-end">
                            <PodiumCard position={2} user={leaderboard[1]} />
                            <PodiumCard position={1} user={leaderboard[0]} />
                            <PodiumCard position={3} user={leaderboard[2]} />
                          </div>

                          {/* Leaderboard Rows */}
                          <div className="space-y-3">
                            {leaderboard.slice(3).map((u, i) => (
                              <LeaderboardRow key={u.id} user={u} rank={i + 4} />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-[3rem]">
                           <p className="text-zinc-600 font-black uppercase tracking-widest">No operatives detected in this sector</p>
                        </div>
                      )}
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
                      {user && leaderboard.some(u => u.id === user.uid) ? (
                        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-emerald-400">#{leaderboard.findIndex(u => u.id === user.uid) + 1}</span>
                            <div>
                              <p className="font-black text-white">Active Status</p>
                              <p className="text-xs text-zinc-400">You are in the top {percentile}%</p>
                            </div>
                          </div>
                          <Zap className="w-6 h-6 text-yellow-500" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-2xl opacity-50">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-zinc-700">#--</span>
                            <div>
                              <p className="font-black text-zinc-600">Unranked</p>
                              <p className="text-xs text-zinc-700">Complete entries to rank</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Total Points" value={leaderboard.find(u => u.id === user?.uid)?.totalPoints?.toString() || "0"} icon={<Zap className="w-4 h-4" />} />
                        <StatCard label="Global Rank" value={user && leaderboard.some(u => u.id === user.uid) ? `#${leaderboard.findIndex(u => u.id === user.uid) + 1}` : "--"} icon={<Globe className="w-4 h-4" />} />
                      </div>
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
              {/* Squad Selector Header */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Radio className="w-6 h-6 text-emerald-500 animate-pulse" />
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-tight">Squad Comms</h2>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Real-time tactical channel</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <select 
                        className="bg-transparent text-sm font-black uppercase text-white outline-none cursor-pointer"
                        value={activeChatSquadId || ""}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          setActiveChatSquadId(val);
                        }}
                      >
                        {yourSquads.length === 0 && <option value="">No Squads Joined</option>}
                        {yourSquads.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Chat Layout - 2 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Real-time Chat Feed */}
                <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col h-[650px]">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-500" /> Live Feed
                    </h4>
                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                      {messages.length} Messages
                    </span>
                  </div>
                  
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-4">
                    {!activeChatSquadId ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                        <Users className="w-12 h-12 text-zinc-700" />
                        <div>
                          <p className="text-sm font-black uppercase text-zinc-600">No Squad Selected</p>
                          <p className="text-[10px] font-bold text-zinc-700 mt-1">Join or create a squad to start chatting</p>
                        </div>
                      </div>
                    ) : chatLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((msg, i) => (
                        <div key={msg.id || i} className={`flex ${msg.userId === user?.uid ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] ${msg.userId === user?.uid ? "order-2" : "order-1"}`}>
                            <div className={`flex items-center gap-2 mb-1 ${msg.userId === user?.uid ? "justify-end" : "justify-start"} px-2`}>
                              <p className="text-[9px] font-black text-zinc-500 uppercase">{msg.userName}</p>
                              <span className="text-[8px] font-bold text-zinc-700">{formatTimestamp(msg.timestamp)}</span>
                            </div>
                            <div className={`px-5 py-3 rounded-3xl text-sm font-bold ${msg.userId === user?.uid 
                              ? "bg-emerald-500 text-white rounded-tr-lg" 
                              : "bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-tl-lg"}`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40">
                        <Radio className="w-10 h-10 text-zinc-700" />
                        <div>
                          <p className="text-sm font-black uppercase text-zinc-600">Channel Clear</p>
                          <p className="text-[10px] font-bold text-zinc-700 mt-1">Be the first to broadcast a message</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="relative">
                    <input 
                      type="text"
                      placeholder={activeChatSquadId ? "Broadcast your message..." : "Select a squad to chat"}
                      disabled={!activeChatSquadId}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-6 pr-16 text-sm font-bold text-white placeholder-zinc-700 outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim() || !activeChatSquadId}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-emerald-500 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* RIGHT: Online Status & Squad Info */}
                <div className="space-y-6">
                  {/* Squad Info Card */}
                  {activeChatSquadId && (
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                        <Shield className="w-4 h-4 text-blue-500" /> Squad Intel
                      </h4>
                      
                      {/* Squad ID for invites */}
                      <div className="mb-6">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Squad ID (Share to invite)</p>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                          <code className="text-xs font-mono text-emerald-400 flex-1 truncate">{activeChatSquadId}</code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(activeChatSquadId);
                            }}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                          >
                            <Copy className="w-3 h-3 text-zinc-400" />
                          </button>
                        </div>
                      </div>

                      {/* Access Code for Private Squads */}
                      {yourSquads.find(s => s.id === activeChatSquadId)?.isPrivate && (
                        <div className="mb-6">
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Access Code (Private)</p>
                          <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                            <Lock className="w-3 h-3 text-blue-500" />
                            <code className="text-xs font-mono text-blue-400 flex-1">{yourSquads.find(s => s.id === activeChatSquadId)?.accessCode}</code>
                            <button 
                              onClick={() => navigator.clipboard.writeText(yourSquads.find(s => s.id === activeChatSquadId)?.accessCode || "")}
                              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                              <Copy className="w-3 h-3 text-blue-400" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Squad Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-center">
                          <p className="text-lg font-black text-white">{yourSquads.find(s => s.id === activeChatSquadId)?.memberIds.length || 0}</p>
                          <p className="text-[8px] font-black text-zinc-600 uppercase">Members</p>
                        </div>
                        <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-center">
                          <p className="text-lg font-black text-emerald-400">{onlineUsers.length}</p>
                          <p className="text-[8px] font-black text-zinc-600 uppercase">Online</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Online Users Card */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                      <Zap className="w-4 h-4 text-yellow-500" /> Active Operatives
                    </h4>
                    
                    <div className="space-y-3">
                      {onlineUsers.length > 0 ? (
                        onlineUsers.map(u => (
                          <div key={u.userId} className="flex items-center gap-3 p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                            <div className="relative">
                              <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-black text-zinc-500">
                                {u.userName?.[0] || "?"}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-white uppercase truncate">{u.userName}</p>
                              <p className="text-[8px] font-bold text-emerald-500 uppercase">Online</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 opacity-50">
                          <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                          <p className="text-[10px] font-black text-zinc-700 uppercase">
                            {activeChatSquadId ? "No operatives online" : "Select a squad"}
                          </p>
                        </div>
                      )}
                    </div>
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
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
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
                    value={newSquadDesc}
                    onChange={(e) => setNewSquadDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white font-black placeholder-zinc-700 hover:border-zinc-700 focus:border-emerald-500 transition-all outline-none resize-none"
                  />
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Security Protocol
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setNewSquadPrivate(false)}
                      className={`p-6 border rounded-2xl cursor-pointer transition-all hover:border-emerald-500/50 group ${!newSquadPrivate ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950/50 border-zinc-800'}`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${!newSquadPrivate ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
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

                    <div 
                      onClick={() => setNewSquadPrivate(true)}
                      className={`p-6 border rounded-2xl cursor-pointer transition-all hover:border-blue-500/50 group ${newSquadPrivate ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-950/50 border-zinc-800'}`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${newSquadPrivate ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>
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
                    onClick={handleCreateSquad}
                    disabled={loading || !newSquadName}
                    className="flex-[2] py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Users className="w-4 h-4" /> {loading ? "Initializing..." : "Initialize Squad"}
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
              className="relative w-full max-xl bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl"
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
                      placeholder="Enter squad code..."
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white font-black placeholder-zinc-700 hover:border-zinc-700 focus:border-blue-500 transition-all outline-none text-center tracking-widest uppercase"
                      maxLength={8}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <QrCode className="w-5 h-5 text-zinc-700" />
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
                    onClick={handleJoinSquad}
                    disabled={loading || !joinCode}
                    className="flex-[2] py-5 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Key className="w-4 h-4" /> {loading ? "Authenticating..." : "Authenticate & Join"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-Components

function PodiumCard({ position, user }: { position: number, user?: UserProfile }) {
  if (!user) return <PodiumSkeleton position={position} />;
  
  const height = position === 1 ? "h-64" : position === 2 ? "h-56" : "h-48";
  const color = position === 1 ? "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30" : position === 2 ? "from-zinc-400/20 to-zinc-400/5 border-zinc-400/30" : "from-orange-500/20 to-orange-500/5 border-orange-500/30";
  
  return (
    <div className={`relative ${height} bg-gradient-to-b ${color} border rounded-[2.5rem] p-6 flex flex-col items-center justify-end group hover:scale-[1.02] transition-all`}>
      <div className="absolute -top-10">
        <div className="relative">
          <div className={`w-20 h-20 rounded-full border-4 border-[#050505] overflow-hidden bg-zinc-800`}>
            {user.photoURL ? <img src={user.photoURL} alt={user.displayName} /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-zinc-600">{user.displayName[0]}</div>}
          </div>
          {position === 1 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500 drop-shadow-lg" />}
        </div>
      </div>
      
      <div className="text-center w-full">
        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1 truncate">{user.displayName}</p>
        <div className="flex items-center justify-center gap-1.5 text-white mb-4">
           <Zap className="w-4 h-4 text-yellow-500" />
           <span className="text-xl font-black italic">{user.totalPoints}</span>
        </div>
        <div className={`py-2 px-4 rounded-xl bg-black/40 text-sm font-black text-white italic`}>
          #{position}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
          : 'bg-zinc-900/50 border border-zinc-800 text-zinc-600 hover:text-zinc-400'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-zinc-100 text-zinc-950 border border-zinc-100' 
          : 'bg-zinc-900/50 border border-zinc-800 text-zinc-600 hover:text-zinc-400'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function LeaderboardRow({ user, rank }: { user: UserProfile, rank: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl group hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <span className="text-sm font-black text-zinc-500 tracking-tighter">#{rank}</span>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-xs font-black text-zinc-600">
              {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : user.displayName[0]}
           </div>
           <div>
              <p className="font-black text-white text-sm italic">{user.displayName}</p>
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase">
                 <Target className="w-3 h-3" /> {user.badges?.length || 0} Milestones
              </div>
           </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="flex items-center gap-1.5 text-white font-black italic mb-0.5">
           <Zap className="w-3 h-3 text-yellow-500" />
           {user.totalPoints}
        </div>
        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Active Protocol</p>
      </div>
    </div>
  );
}

function SquadCard({ squad }: { squad: Squad }) {
  return (
    <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-3xl group hover:border-emerald-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
             <Users className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
             <h4 className="font-black text-white italic uppercase tracking-tight">{squad.name}</h4>
             <p className="text-xs text-zinc-500">{squad.memberIds.length} Operatives Active</p>
          </div>
        </div>
        <div className="text-right text-[10px] font-black text-zinc-600 uppercase border border-zinc-800 px-3 py-1 rounded-lg">
           {squad.isPrivate ? "Restricted" : "Open"}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
         <div className="flex -space-x-2">
            {squad.memberIds.slice(0, 4).map((m, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-600">
                 {i+1}
              </div>
            ))}
            {squad.memberIds.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center text-[10px] font-black text-white">
                 +{squad.memberIds.length - 4}
              </div>
            )}
         </div>
         
         <div className="flex items-center gap-2">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total XP</span>
            <span className="text-emerald-400 font-black italic">{squad.totalPoints}</span>
         </div>
      </div>
    </div>
  );
}

function FeedPostCard({ post, onLike, isLiked }: { post: CommunityPost, onLike: () => void, isLiked: boolean }) {
  const { user } = useAuth();
  return (
    <motion.div 
      layout
      className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 group hover:border-zinc-700 transition-all"
    >
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            {post.userPhotoURL ? (
              <img src={post.userPhotoURL} alt={post.userName} className="w-12 h-12 rounded-full border border-zinc-800 object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-black text-zinc-600">
                 {post.userName[0]}
              </div>
            )}
            <div>
               <p className="font-black text-white italic uppercase">{post.userName}</p>
               <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                 {post.type === 'achievement' ? 'Earned Achievement' : 'Logged Activity'}
               </p>
            </div>
         </div>
         <div className="flex flex-col items-end">
           <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Signal Received</span>
           <span className="text-[8px] text-zinc-800 font-bold uppercase tracking-tighter">{formatTimestamp(post.createdAt)}</span>
         </div>
      </div>

      <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-3xl relative overflow-hidden">
         <p className="text-zinc-300 font-bold leading-relaxed">{post.content}</p>
         {post.impact && (
           <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-800/50">
              <div className="flex items-center gap-3">
                 <Cloud className="w-4 h-4 text-blue-400" />
                 <div>
                    <p className="text-[10px] text-zinc-600 uppercase font-black">Carbon Saved</p>
                    <p className="text-sm font-black text-white">{post.impact.co2}kg</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <Droplets className="w-4 h-4 text-emerald-400" />
                 <div>
                    <p className="text-[10px] text-zinc-600 uppercase font-black">Water Saved</p>
                    <p className="text-sm font-black text-white">{post.impact.water}L</p>
                 </div>
              </div>
           </div>
         )}
      </div>

      <div className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            <button 
              onClick={onLike}
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${isLiked ? 'text-pink-500' : 'text-zinc-600 hover:text-white'}`}
            >
               <Heart className={`w-5 h-5 ${isLiked ? 'fill-pink-500' : ''}`} />
               {post.likes.length} Claps
            </button>
            <button className="flex items-center gap-2 text-xs font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">
               <Share2 className="w-5 h-5" />
               Share
            </button>
         </div>
         <div className="text-[10px] text-zinc-800 font-black uppercase tracking-widest">
           // Decrypting...
         </div>
      </div>
    </motion.div>
  );
}

function SquadSearchResultCard({ squad, onJoin }: { squad: Squad, onJoin: () => void }) {
  return (
    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 font-black text-blue-500">
          {squad.name[0]}
        </div>
        <div>
          <p className="text-sm font-black text-white uppercase italic">{squad.name}</p>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{squad.memberIds.length} Operatives</p>
        </div>
      </div>
      <button 
        onClick={onJoin}
        className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase rounded-xl hover:bg-blue-500 hover:text-white transition-all"
      >
        Enlist
      </button>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">{label}</span>
        <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
          {icon}
        </div>
      </div>
      <p className="text-xl font-black text-white italic">{value}</p>
    </div>
  );
}

function TrendingTopic({ label, posts }: { label: string, posts: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl group cursor-pointer hover:border-emerald-500/30 transition-all">
      <div>
         <p className="text-sm font-black text-white italic group-hover:text-emerald-400 transition-colors uppercase">{label}</p>
         <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">{posts} Operatives Active</p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-emerald-500 transition-colors" />
    </div>
  );
}

function TopSquadCard({ squad, rank }: { squad: Squad, rank: number }) {
  return (
    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl group hover:border-yellow-500/30 transition-all flex items-center justify-between">
      <div className="flex items-center gap-4">
         <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-500">
            #{rank}
         </div>
         <div>
            <p className="font-black text-white italic uppercase text-sm">{squad.name}</p>
            <p className="text-[10px] text-zinc-600 font-bold uppercase">{squad.memberIds.length} Operatives</p>
         </div>
      </div>
      <div className="text-right">
         <div className="flex items-center gap-1.5 text-yellow-500 font-black italic">
            <Zap className="w-3 h-3" />
            {squad.totalPoints}
         </div>
      </div>
    </div>
  );
}

// Skeleton Components

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