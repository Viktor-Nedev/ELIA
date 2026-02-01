"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { sustainabilityService } from "@/lib/sustainability.service";
import { UserProfile, FriendRequest } from "@/lib/types";
import { 
  ArrowLeft, User, Mail, Settings, Users, LogOut, 
  Shield, Bell, BellOff, Edit2, Search, Check, X,
  ExternalLink, Trophy,  Filter, Globe, Activity, Ghost, ShieldAlert, Star, Eye, EyeOff, Zap, Droplets, Leaf
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"squad" | "global">("squad");
  const [editMode, setEditMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  
  // Form state
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  
  // Social state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friendsProfiles, setFriendsProfiles] = useState<UserProfile[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<UserProfile[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  // Load Initial Data
  useEffect(() => {
    if (user) {
      loadProfile();
      loadSocialData();
      loadGlobalData();
    }
  }, [user]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await sustainabilityService.getUserProfile(user.uid);
      if (data) {
        setProfile(data);
        setEditName(data.displayName || "");
        setEditPhoto(data.photoURL || "");
      }
    } catch (err) {
      console.error("Profile Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSocialData = async () => {
    if (!user) return;
    try {
      const [requests, profileData] = await Promise.all([
        sustainabilityService.getFriendRequests(user.uid),
        sustainabilityService.getUserProfile(user.uid)
      ]);
      setPendingRequests(requests);
      
      if (profileData?.friends && profileData.friends.length > 0) {
        const friends = await sustainabilityService.getFriendsProgress(profileData.friends);
        setFriendsProfiles(friends);
      }
    } catch (err) {
      console.error("Social Load Error:", err);
    }
  };

  const loadGlobalData = async () => {
    try {
      const leaderboard = await sustainabilityService.getLeaderboard('global', user?.uid);
      setGlobalLeaderboard(leaderboard);
    } catch (err) {
      console.error("Leaderboard Error:", err);
    }
  };

  const performSearch = async () => {
    setSocialLoading(true);
    try {
      const results = await sustainabilityService.searchUsers(searchQuery);
      setSearchResults(results.filter(u => u.id !== user?.uid)); 
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await sustainabilityService.updateProfile(user.uid, {
        displayName: editName,
        photoURL: editPhoto
      });
      setProfile(prev => prev ? { ...prev, displayName: editName, photoURL: editPhoto } : null);
      setEditMode(false);
    } catch (err) {
      console.error("Update Profile Error:", err);
    }
  };

  const handleToggleNotifs = useCallback(async () => {
    if (!user || !profile) return;
    const newVal = !profile.emailNotifications;
    try {
      await sustainabilityService.updateProfile(user.uid, {
        emailNotifications: newVal
      });
      setProfile({ ...profile, emailNotifications: newVal });
    } catch (err) {
      console.error("Toggle Notifs Error:", err);
    }
  }, [user, profile]);

  const handleTogglePrivacy = useCallback(async () => {
    if (!user || !profile) return;
    const newVal = !profile.isPrivate;
    try {
      await sustainabilityService.updatePrivacySetting(user.uid, newVal);
      setProfile({ ...profile, isPrivate: newVal });
    } catch (err) {
      console.error("Toggle Privacy Error:", err);
    }
  }, [user, profile]);

  const handleToggleMapSharing = useCallback(async () => {
    if (!user || !profile) return;
    const newVal = !profile.shareDataOnMap;
    
    if (newVal) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
             await sustainabilityService.toggleMapSharing(user.uid, true, {
               lat: position.coords.latitude,
               lng: position.coords.longitude
             });
             setProfile({ ...profile, shareDataOnMap: true, location: { lat: position.coords.latitude, lng: position.coords.longitude } });
          } catch (err) {
            console.error("Error enabling map sharing:", err);
            alert("Failed to enable map sharing.");
          }
        }, (error) => {
          console.error("Geolocation error:", error);
          alert("We need your location to add you to the map. Please enable location services.");
        });
      } else {
        alert("Geolocation is not supported by your browser.");
      }
    } else {
      try {
        await sustainabilityService.toggleMapSharing(user.uid, false);
        setProfile({ ...profile, shareDataOnMap: false });
      } catch (err) {
        console.error("Error disabling map sharing:", err);
      }
    }
  }, [user, profile]);

  const sortedFriends = useMemo(() => {
    return [...friendsProfiles].sort((a, b) => b.totalPoints - a.totalPoints);
  }, [friendsProfiles]);

  const handleRequest = async (request: FriendRequest, action: "accepted" | "declined") => {
    try {
      await sustainabilityService.handleFriendRequest(request, action);
      await loadSocialData();
    } catch (err) {
      console.error("Handle Request Error:", err);
    }
  };

  const currentRank = useMemo(() => {
    const points = profile?.totalPoints || 0;
    if (points >= 5000) return "Master Operative";
    if (points >= 3000) return "Elite Operative";
    if (points >= 1500) return "Specialist";
    if (points >= 500) return "Active Operative";
    return "Recruit";
  }, [profile?.totalPoints]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] p-12 space-y-12">
        <div className="max-w-[1000px] mx-auto space-y-12">
           {/* <Skeleton className="w-32 h-6" />
           <Skeleton className="w-full h-80 rounded-[3rem]" />
           <div className="grid grid-cols-2 gap-8">
              <Skeleton className="h-96 rounded-[2.5rem]" />
              <Skeleton className="h-96 rounded-[2.5rem]" />
           </div> */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 pb-20">
      <div className="max-w-[1000px] mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-xs font-black tracking-widest mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-3xl border border-zinc-800 rounded-[3rem] p-12 mb-12 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 group-hover:h-2 transition-all"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="relative">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 p-1">
                <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center overflow-hidden border-4 border-zinc-900 shadow-2xl relative">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl font-black text-white italic">{profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}</span>
                  )}
                  {profile?.isPrivate && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                       <Ghost className="w-10 h-10 text-zinc-500" />
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setEditMode(true)}
                className="absolute bottom-2 right-2 bg-emerald-500 p-3 rounded-2xl border-4 border-zinc-900 hover:scale-110 transition-transform shadow-lg z-10"
              >
                <Edit2 className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">{profile?.displayName}</h2>
                  {profile?.isPrivate && <span className="px-3 py-1 bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase tracking-widest rounded-lg">Ghost Mode</span>}
                </div>
                <p className="inline-flex px-4 py-1.5 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-500 font-bold uppercase tracking-widest text-[10px] items-center gap-2">
                  <Mail className="w-3 h-3 text-emerald-500" /> {user?.email}
                </p>
              </div>

              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4 w-full">
                 <StatDisplay label="Rank" value={currentRank} color="text-emerald-400" />
                 <StatDisplay label="Points" value={profile?.totalPoints?.toLocaleString() || "0"} color="text-blue-400" />
                 <StatDisplay label="Connections" value={profile?.friends?.length?.toString() || "0"} color="text-zinc-400" />
                 <Link href="/achievements" className="flex-1 min-w-[120px]">
                    <StatDisplay label="Medals" value={(profile?.earnedAchievements?.length || 0).toString()} color="text-orange-400 hover:text-orange-300 transition-colors" />
                 </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-12">
             <div className="flex gap-8 border-b border-zinc-800 mb-8 px-4">
                <TabButton active={tab === "squad"} onClick={() => setTab("squad")} label="Squad Ops" icon={<Users className="w-4 h-4" />} />
                <TabButton active={tab === "global"} onClick={() => setTab("global")} label="Global Rankings" icon={<Trophy className="w-4 h-4" />} />
             </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {tab === "squad" ? (
                <motion.div 
                  key="squad"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Active Operatives</h3>
                     <button 
                        onClick={() => setSearchMode(!searchMode)}
                        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${searchMode ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
                     >
                       {searchMode ? "End Recon" : "New Operative"} <Search className="w-3 h-3" />
                     </button>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 min-h-[500px]">
                    {searchMode ? (
                      <div className="space-y-8">
                         <div className="relative">
                            <input 
                              type="text" 
                              placeholder="Locate user by alias..." 
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold placeholder-zinc-700 outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700" />
                            {socialLoading && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>}
                         </div>

                         <div className="space-y-3">
                            {searchResults.map(u => (
                              <SearchItem key={u.id} user={u} onInvite={() => profile && sustainabilityService.sendFriendRequest(profile, u.id!)} />
                            ))}
                            {searchQuery && searchResults.length === 0 && !socialLoading && <p className="text-center py-10 text-zinc-700 font-bold italic">No public operatives found.</p>}
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-10">
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                               <ShieldAlert className="w-3 h-3" /> Clearance Requests
                             </p>
                             {pendingRequests.length > 0 ? (
                               pendingRequests.map(r => (
                                 <RequestItem key={r.id} request={r} onAccept={() => handleRequest(r, "accepted")} onDecline={() => handleRequest(r, "declined")} />
                               ))
                             ) : (
                               <div className="p-8 text-center bg-zinc-950/30 border border-zinc-800/50 border-dashed rounded-3xl group hover:border-zinc-700/50 transition-all">
                                 <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest italic">No pending uplink requests.</p>
                               </div>
                             )}
                          </div>

                         <div className="space-y-4">
                           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-4">Leaderboard Sync</p>
                           {sortedFriends.length > 0 ? sortedFriends.map((f, i) => (
                              <OperativeCard key={f.id} user={f} rank={i + 1} />
                           )) : (
                             <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                                <Ghost className="w-12 h-12" />
                                <p className="text-xs font-bold uppercase tracking-widest italic max-w-xs">Operative network offline. Recruit allies to synchronize data.</p>
                             </div>
                           )}
                         </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="global"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Global Vanguard</h3>
                     <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Public Directory Only</span>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 min-h-[500px] space-y-4">
                      {globalLeaderboard.map((u, i) => (
                        <OperativeCard key={u.id} user={u} rank={i + 1} highlight />
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-4">System Configurations</h3>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
               <div className="p-4 space-y-1">
                  <ConfigItem 
                    icon={profile?.emailNotifications ? <Bell className="w-5 h-5 text-emerald-500" /> : <BellOff className="w-5 h-5 text-zinc-600" />} 
                    title="Neural Reports" 
                    desc="Weekly sync via encrypted email."
                    action={<Toggle checked={profile?.emailNotifications || false} onChange={handleToggleNotifs} />}
                  />
                  <ConfigItem 
                    icon={profile?.isPrivate ? <Ghost className="w-5 h-5 text-purple-500" /> : <Activity className="w-5 h-5 text-blue-500" />} 
                    title="Ghost Mode" 
                    desc="Invisibility to global scanners."
                    action={<Toggle checked={profile?.isPrivate || false} onChange={handleTogglePrivacy} />}
                  />
                  <ConfigItem 
                    icon={profile?.shareDataOnMap ? <Globe className="w-5 h-5 text-blue-500" /> : <Globe className="w-5 h-5 text-zinc-600" />} 
                    title="Global Impact Map" 
                    desc="Contribute your savings to the public heatmap."
                    action={<Toggle checked={profile?.shareDataOnMap || false} onChange={handleToggleMapSharing} />}
                  />
                  <ConfigItem 
                    icon={<Shield className="w-5 h-5 text-zinc-500" />} 
                    title="Firewall Level" 
                    desc={`Identity protection grade (${currentRank === 'Master Operative' ? 'Elite' : 'Standard'}).`}
                  />
               </div>
               
               <div className="p-8 bg-black/40 border-t border-zinc-800 mt-4">
                  <button 
                    onClick={async () => {
                      await signOut();
                      router.push("/login");
                    }}
                    className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-500/20 transition-all hover:scale-[1.02]"
                  >
                    <LogOut className="w-4 h-4" /> Finalize Session
                  </button>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setEditMode(false)}
               className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
             />
             <motion.form 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               onSubmit={handleUpdateProfile}
               className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 space-y-10 shadow-2xl"
             >
                <div className="space-y-2 text-center">
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Identity Uplink</h3>
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] ml-1">Modifier Interface</p>
                </div>

                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <User className="w-3 h-3" /> Display Alias
                      </label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white font-black hover:border-zinc-700 focus:border-emerald-500 transition-all outline-none"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Settings className="w-3 h-3" /> External Avatar Link
                      </label>
                      <input 
                        type="url" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white font-black hover:border-zinc-700 focus:border-emerald-500 transition-all outline-none italic"
                        placeholder="https://source.unsplash.com/..."
                        value={editPhoto}
                        onChange={(e) => setEditPhoto(e.target.value)}
                      />
                   </div>
                </div>

                <div className="flex gap-4">
                   <button 
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-600 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit"
                    className="flex-[2] py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                   >
                     Commit Uplink
                   </button>
                </div>
             </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Optimized Components

function StatDisplay({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="px-6 py-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl flex flex-col gap-1 min-w-[120px]">
       <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
       <p className={`text-xl font-black italic ${color}`}>{value}</p>
    </div>
  );
}

function OperativeCard({ user, rank, highlight }: { user: UserProfile, rank: number, highlight?: boolean }) {
  const getRankColor = () => {
    if (rank === 1) return "text-yellow-400 border-yellow-400";
    if (rank === 2) return "text-zinc-300 border-zinc-400";
    if (rank === 3) return "text-amber-600 border-amber-700";
    return "text-zinc-600 border-zinc-800";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`p-5 bg-zinc-950/80 border ${highlight ? "border-blue-500/20" : "border-zinc-800"} rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-crosshair`}
    >
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-zinc-900 overflow-hidden border-2 border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
            {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-lg italic">{user.displayName[0]}</div>}
          </div>
          <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-lg bg-zinc-950 border ${getRankColor()} flex items-center justify-center text-[10px] font-black shadow-xl`}>
             {rank}
          </div>
        </div>
        <div>
          <h4 className="font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic tracking-tighter">{user.displayName}</h4>
          <div className="flex gap-1.5 mt-1">
             {user.badges.slice(0, 5).map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20"></div>)}
             <span className="text-[8px] font-black text-zinc-700 ml-1 uppercase">{user.badges.length} Medals</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-xl font-black italic tracking-tighter ${rank <= 3 ? "text-blue-400" : "text-zinc-400"}`}>{user.totalPoints.toLocaleString()} <span className="text-[8px] uppercase not-italic">XP</span></p>
        <div className="flex items-center justify-end gap-1 opacity-50">
           <Zap className="w-2.5 h-2.5 text-blue-500" />
           <p className="text-[8px] font-black uppercase text-zinc-600">Active Duty</p>
        </div>
      </div>
    </motion.div>
  );
}

function SearchItem({ user, onInvite }: { user: UserProfile, onInvite: () => void }) {
  const [invited, setInvited] = useState(false);
  
  const handleInvite = async () => {
    setInvited(true);
    await onInvite();
  };

  return (
    <div className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-800 rounded-3xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700">
           {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <span className="font-black">{user.displayName[0]}</span>}
        </div>
        <div>
          <p className="font-black text-white uppercase italic text-sm">{user.displayName}</p>
          <div className="flex items-center gap-2 mt-0.5">
             <Trophy className="w-2.5 h-2.5 text-blue-500" />
             <p className="text-[9px] font-bold text-zinc-600 uppercase">{user.totalPoints} PTS</p>
          </div>
        </div>
      </div>
      <button 
        disabled={invited}
        onClick={handleInvite}
        className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${invited ? "bg-zinc-800 text-zinc-500" : "bg-emerald-500 hover:scale-105 active:scale-95 text-white"}`}
      >
        {invited ? "Requested" : "Deploy Invite"}
      </button>
    </div>
  );
}

function RequestItem({ request, onAccept, onDecline }: { request: FriendRequest, onAccept: () => void, onDecline: () => void }) {
  return (
    <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex items-center justify-between">
      <p className="text-xs font-black text-amber-200 uppercase italic tracking-tighter">{request.fromName} <span className="text-zinc-600 not-italic">is seeking clearance</span></p>
      <div className="flex gap-3">
         <button onClick={onDecline} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
         <button onClick={onAccept} className="px-6 py-2 bg-emerald-500 rounded-xl text-white text-[10px] font-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">Authorize</button>
      </div>
    </div>
  );
}

function ConfigItem({ icon, title, desc, action }: { icon: any, title: string, desc: string, action?: any }) {
  return (
    <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-all rounded-3xl group">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black border border-zinc-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:border-emerald-500/30 transition-all">
             {icon}
          </div>
          <div>
             <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic tracking-tighter">{title}</h4>
             <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{desc}</p>
          </div>
       </div>
       {action}
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: any }) {
  return (
    <button 
      onClick={onClick}
      className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${active ? "text-emerald-400" : "text-zinc-600 hover:text-zinc-300"}`}
    >
      {icon} {label}
      {active && <motion.div layoutId="notif-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />}
    </button>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-zinc-900/50 animate-pulse ${className}`} />;
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-14 h-7 rounded-full p-1 transition-all duration-500 ${checked ? "bg-emerald-500/20 border border-emerald-500/50" : "bg-zinc-900 border border-zinc-800"}`}
    >
      <div className={`w-5 h-5 rounded-full transition-all duration-500 transform ${checked ? "translate-x-7 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "translate-x-0 bg-zinc-700"}`} />
    </button>
  );
}
