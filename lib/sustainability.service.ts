import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc,
  Timestamp,
  serverTimestamp,
  writeBatch,
  limit,
  arrayUnion
} from "firebase/firestore";
import { DailyEntry, Challenge, UserProfile, EnvironmentalImpact, FriendRequest, Habit, Achievement, Squad, CommunityPost, QuizQuestion, QuizAttempt, GameSession } from "./types";
import { mailService } from "./mail.service";


// Collections
const ENTRIES_COL = "dailyEntries";
const CHALLENGES_COL = "challenges";
const USERS_COL = "users";
const REQUESTS_COL = "friendRequests";
const SQUADS_COL = "squads";
const POSTS_COL = "communityPosts";
const QUIZZES_COL = "quizzes";
const QUIZ_ATTEMPTS_COL = "quizAttempts";
const GAME_SESSIONS_COL = "gameSessions";

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_entry", name: "Pioneer", description: "Logged your first sustainability report.", icon: "🚀", pointsBonus: 50 },
  { id: "points_100", name: "Eco Starter", description: "Reached 100 total points.", icon: "🌱", pointsBonus: 100 },
  { id: "points_500", name: "Eco Hero", description: "Reached 500 total points.", icon: "🦸", pointsBonus: 250 },
  { id: "points_1000", name: "Eco Champion", description: "Reached 1,000 total points.", icon: "🏆", pointsBonus: 500 },
  { id: "streak_7", name: "Weekly Warrior", description: "Maintained a 7-day streak.", icon: "🔥", pointsBonus: 200 },
  { id: "water_1000", name: "Aquamist", description: "Saved over 1,000L of water.", icon: "💧", pointsBonus: 150 },
  { id: "co2_50", name: "Carbon Killer", description: "Saved over 50kg of CO2.", icon: "📉", pointsBonus: 200 },
  { id: "habit_master", name: "Habit Master", description: "Completed 10 challenges.", icon: "✨", pointsBonus: 300 },
  { id: "quiz_whiz", name: "Quiz Whiz", description: "Answered 10 quizzes correctly.", icon: "🧠", pointsBonus: 100 },
  { id: "quiz_perfect", name: "Perfect Score", description: "Got a perfect score in a quiz session.", icon: "💯", pointsBonus: 200 },
  { id: "game_champion", name: "Game Champion", description: "Played 5 different games.", icon: "🎮", pointsBonus: 150 },
  { id: "sorter_master", name: "Sorter Master", description: "Score over 1000 in Carbon Sort.", icon: "♻️", pointsBonus: 300 },
];

export const sustainabilityService = {
  // Entries
  async upsertEntry(entry: Omit<DailyEntry, "createdAt" | "id">) {
    const batch = writeBatch(db);
    const today = entry.date;
    
    // Check if entry for today exists
    const q = query(
      collection(db, ENTRIES_COL),
      where("userId", "==", entry.userId),
      where("date", "==", today),
      limit(1)
    );
    const snap = await getDocs(q);
    
    let entryRef;
    let pointDiff = entry.points;

    if (!snap.empty) {
      // Revision
      const existingEntry = snap.docs[0];
      entryRef = existingEntry.ref;
      pointDiff = entry.points - (existingEntry.data().points || 0);
      batch.update(entryRef, {
        ...entry,
        lastModified: serverTimestamp()
      });
    } else {
      // New Entry
      entryRef = doc(collection(db, ENTRIES_COL));
      batch.set(entryRef, {
        ...entry,
        createdAt: serverTimestamp()
      });
    }

    // Update user points atomically
    const userRef = doc(db, USERS_COL, entry.userId);
    const userSnap = await getDoc(userRef);
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentPoints = data.totalPoints || 0;
      let weeklyPoints = data.weeklyPoints || 0;
      const lastReset = data.lastWeeklyReset || "";

      if (lastReset < startOfWeekStr) {
        weeklyPoints = pointDiff; // Start new week
      } else {
        weeklyPoints += pointDiff;
      }

      batch.update(userRef, { 
        totalPoints: currentPoints + pointDiff,
        weeklyPoints,
        lastWeeklyReset: startOfWeekStr
      });
    } else {
      batch.set(userRef, {
        totalPoints: entry.points,
        weeklyPoints: entry.points,
        lastWeeklyReset: startOfWeekStr,
        badges: [],
        friends: [],
        displayName: "",
        email: "",
        emailNotifications: true,
        isPrivate: false
      }, { merge: true });
    }

    await batch.commit();
    
    // Check for achievements after entry
    const newAchievements = await this.checkAndAwardAchievements(entry.userId);
    
    return { id: entryRef.id, newAchievements: newAchievements || [] };
  },

  async getRecentEntries(userId: string, limitCount = 14) {
    const q = query(
      collection(db, ENTRIES_COL),
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyEntry));
  },

  async getEntryForToday(userId: string) {
    const today = new Date().toISOString().split("T")[0];
    const q = query(
      collection(db, ENTRIES_COL),
      where("userId", "==", userId),
      where("date", "==", today),
      limit(1)
    );
    const snap = await getDocs(q);
    return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as DailyEntry);
  },

  // Challenges
  async getActiveChallenges(userId: string) {
    const q = query(
      collection(db, CHALLENGES_COL),
      where("userId", "==", userId),
      where("completed", "==", false)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge));
  },

  async getCompletedChallenges(userId: string) {
    const q = query(
      collection(db, CHALLENGES_COL),
      where("userId", "==", userId),
      where("completed", "==", true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge));
  },

  async completeChallenge(challengeId: string, userId: string, points: number) {
    const batch = writeBatch(db);
    const challengeRef = doc(db, CHALLENGES_COL, challengeId);
    batch.update(challengeRef, { completed: true });

    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentPoints = userSnap.data().totalPoints || 0;
      batch.update(userRef, { totalPoints: currentPoints + points });
    }

    await batch.commit();

    // Check for achievements after challenge
    await this.checkAndAwardAchievements(userId);
  },

  // Profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, USERS_COL, userId);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
  },

  async ensureUserProfile(userId: string, data: Partial<UserProfile>) {
    const docRef = doc(db, USERS_COL, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        displayName: data.displayName || "",
        email: data.email || "",
        totalPoints: 0,
        badges: [],
        friends: [],
        emailNotifications: true,
        ...data
      });
    }
  },

  async updateProfile(userId: string, data: Partial<UserProfile>) {
    const docRef = doc(db, USERS_COL, userId);
    await updateDoc(docRef, data);
  },


  async updatePrivacySetting(userId: string, isPrivate: boolean) {
    const docRef = doc(db, USERS_COL, userId);
    await updateDoc(docRef, { isPrivate });
  },

  // Social
  async sendFriendRequest(fromUser: UserProfile, toUserId: string) {
    const toUserSnap = await getDoc(doc(db, USERS_COL, toUserId));
    if (!toUserSnap.exists()) throw new Error("Target user not found");
    const toUser = toUserSnap.data() as UserProfile;

    const request: Omit<FriendRequest, "id"> = {
      fromId: fromUser.id!,
      fromName: fromUser.displayName,
      toId: toUserId,
      status: "pending",
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, REQUESTS_COL), request);
    
    // Notify if enabled
    if (toUser.emailNotifications) {
      await mailService.notifyFriendRequest(toUser.email, fromUser.displayName);
    }
    
    return docRef.id;
  },

  async getFriendRequests(userId: string) {
    const q = query(
      collection(db, REQUESTS_COL),
      where("toId", "==", userId),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
  },

  // async handleFriendRequest(request: FriendRequest, action: "accepted" | "declined") {
  //   const batch = writeBatch(db);
  //   const requestRef = doc(db, REQUESTS_COL, request.id!);
  //   batch.update(requestRef, { status: action });
    
  //   if (action === "accepted") {
  //     const userRef = doc(db, USERS_COL, request.toId);
  //     const friendRef = doc(db, USERS_COL, request.fromId);
      
  //     const userSnap = await getDoc(userRef);
  //     const friendSnap = await getDoc(friendRef);
      
  //     if (userSnap.exists() && friendSnap.exists()) {
  //       const userFriends = userSnap.data().friends || [];
  //       const friendFriends = friendSnap.data().friends || [];
        
  //       batch.update(userRef, { friends: [...userFriends, request.fromId] });
  //       batch.update(friendRef, { friends: [...friendFriends, request.toId] });
        
  //       // Notify
  //       if (friendSnap.data().emailNotifications) {
  //         await mailService.notifyFriendAccepted(friendSnap.data().email, userSnap.data().displayName);
  //       }
  //     }
  //   }

  //   await batch.commit();
  // },


  async handleFriendRequest(
    request: FriendRequest,
    action: "accepted" | "declined"
  ) {
    const batch = writeBatch(db);
    const requestRef = doc(db, REQUESTS_COL, request.id!);
  
    batch.update(requestRef, { status: action });
  
    if (action === "accepted") {
      const userRef = doc(db, USERS_COL, request.toId);
      const friendRef = doc(db, USERS_COL, request.fromId);
    
      batch.update(userRef, {
        friends: arrayUnion(request.fromId),
      });
    
      batch.update(friendRef, {
        friends: arrayUnion(request.toId),
      });
    }
  
    await batch.commit();
  },


  async getFriendsProgress(friendIds: string[]) {
    if (!friendIds || friendIds.length === 0) return [];
    
    // Fetch profiles of friends
    // Firestore "in" query limited to 30 elements
    const q = query(
      collection(db, USERS_COL),
      where("__name__", "in", friendIds.slice(0, 30))
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
  },

  // Analytics & Aggregations
  async getImpactComparison(userId: string) {
    // Get last 7 days vs previous 7 days
    const entries = await this.getRecentEntries(userId, 14);
    const currentWeek = entries.slice(0, 7);
    const previousWeek = entries.slice(7, 14);

    const calculateTotalImpact = (items: DailyEntry[]) => {
      return items.reduce((acc, curr) => ({
        co2: acc.co2 + (curr.emissions.co2 || 0),
        water: acc.water + (curr.emissions.water || 0),
        energy: acc.energy + (curr.emissions.energy || 0),
        waste: acc.waste + (curr.emissions.waste || 0),
        food: acc.food + (curr.emissions.food || 0),
      }), { co2: 0, water: 0, energy: 0, waste: 0, food: 0 } as EnvironmentalImpact);
    };

    return {
      current: calculateTotalImpact(currentWeek),
      previous: calculateTotalImpact(previousWeek)
    };
  },

  async getSuggestedHabits(userId: string) {
    const q = query(
      collection(db, "habits"),
      limit(5)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async savePersistedHabits(userId: string, habits: Habit[]) {
    const userRef = doc(db, USERS_COL, userId);
    await updateDoc(userRef, { suggestedHabits: habits });
  },

  async activateHabitAsChallenge(userId: string, habit: Habit) {
    const batch = writeBatch(db);
    
    // Create challenge
    const challengeRef = doc(collection(db, CHALLENGES_COL));
    const challenge: Omit<Challenge, "id"> = {
      userId,
      title: habit.title,
      description: habit.description,
      emissionType: habit.impactType,
      target: habit.difficulty === "easy" ? 5 : habit.difficulty === "medium" ? 15 : 30,
      completed: false,
      pointsReward: habit.difficulty === "easy" ? 50 : habit.difficulty === "medium" ? 150 : 300,
      createdAt: serverTimestamp()
    };
    batch.set(challengeRef, challenge);

    // Remove from suggested in user profile
    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentHabits = (userSnap.data().suggestedHabits || []) as Habit[];
      const updatedHabits = currentHabits.filter(h => h.title !== habit.title);
      batch.update(userRef, { suggestedHabits: updatedHabits });
    }

    await batch.commit();
    return challengeRef.id;
  },

  async checkAndAwardAchievements(userId: string) {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;

    const entries = await this.getRecentEntries(userId, 100);
    const earnedIds = new Set(profile.earnedAchievements || []);
    const newAchievements: Achievement[] = [];

    // Calculate Progress Metrics
    const totalCO2 = entries.reduce((sum, e) => sum + (e.emissions.co2 || 0), 0);
    const totalWater = entries.reduce((sum, e) => sum + (e.emissions.water || 0), 0);
    const completedChallenges = await this.getCompletedChallenges(userId);
    
    const calculateStreak = (entries: DailyEntry[]) => {
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
    const streak = calculateStreak(entries);

    // Check Milestones
    for (const ach of ACHIEVEMENTS) {
      if (earnedIds.has(ach.id)) continue;

      let earned = false;
      switch (ach.id) {
        case "first_entry": 
          if (entries.length >= 1) earned = true; 
          break;
        case "points_100": 
          if (profile.totalPoints >= 100) earned = true; 
          break;
        case "points_500": 
          if (profile.totalPoints >= 500) earned = true; 
          break;
        case "points_1000": 
          if (profile.totalPoints >= 1000) earned = true; 
          break;
        case "streak_7": 
          if (streak >= 7) earned = true; 
          break;
        case "water_1000": 
          if (totalWater >= 1000) earned = true; 
          break;
        case "co2_50": 
          if (totalCO2 >= 50) earned = true; 
          break;
        case "habit_master": 
          if (completedChallenges.length >= 10) earned = true; 
          break;
        
        // --- NEW ACHIEVEMENTS ---
        case "quiz_whiz":
          // Answered 10 quizzes correctly
          if ((profile.quizStats?.totalCorrect || 0) >= 10) earned = true;
          break;
        case "quiz_perfect":
          // Interpret "Perfect Score in a session" as a streak of 5 correct answers in quizzes
          // Since quizzes are individual, currentStreak >= 5 is a good proxy.
          if ((profile.quizStats?.currentStreak || 0) >= 5) earned = true;
          break;
        case "game_champion":
          // Played 5 different games
          // lastGamePlayedAt has keys for each game ID played
          if (Object.keys(profile.lastGamePlayedAt || {}).length >= 5) earned = true;
          break;
        case "sorter_master":
          // Score over 1000 in Carbon Sort
          // Check highScores for 'carbon-sort'
          if ((profile.highScores?.['carbon-sort'] || 0) >= 1000) earned = true;
          break;
      }

      if (earned) {
        newAchievements.push(ach);
      }
    }

    if (newAchievements.length === 0) return;

    // Award Achievements
    const batch = writeBatch(db);
    const userRef = doc(db, USERS_COL, userId);
    
    const updatedEarned = [...(profile.earnedAchievements || []), ...newAchievements.map(a => a.id)];
    const updatedBadges = [...(profile.badges || []), ...newAchievements.map(a => a.name)];
    const bonusPoints = newAchievements.reduce((sum, a) => sum + a.pointsBonus, 0);

    batch.update(userRef, {
      earnedAchievements: updatedEarned,
      badges: updatedBadges,
      totalPoints: (profile.totalPoints || 0) + bonusPoints
    });

    await batch.commit();

    // Notify Friends (parallelly)
    if (profile.friends && profile.friends.length > 0) {
      const friends = await this.getFriendsProgress(profile.friends);
      const notifications = [];
      
      for (const ach of newAchievements) {
        for (const friend of friends) {
          if (friend.emailNotifications) {
            notifications.push(mailService.notifyAchievementEarned(friend.email, profile.displayName, ach.name));
          }
        }
      }
      
      await Promise.allSettled(notifications);
    }

    return newAchievements;
  },

  // Community & Social
  async getLeaderboard(type: 'global' | 'weekly' | 'friends', currentUserId?: string) {
    let q;
    if (type === 'global') {
      q = query(
        collection(db, USERS_COL),
        where("isPrivate", "==", false),
        orderBy("totalPoints", "desc"),
        limit(50)
      );
    } else if (type === 'weekly') {
      q = query(
        collection(db, USERS_COL),
        where("isPrivate", "==", false),
        orderBy("weeklyPoints", "desc"),
        limit(50)
      );
    } else if (type === 'friends' && currentUserId) {
      const profile = await this.getUserProfile(currentUserId);
      const friendIds = [...(profile?.friends || []), currentUserId];
      
      // Firestore 'in' query limit is 10, so we might need multiple queries if friends > 10
      // For MVP, we'll slice to 10 for simplicity or fetch all and sort in memory if needed
      q = query(
        collection(db, USERS_COL),
        where("__name__", "in", friendIds.slice(0, 10)),
        orderBy("totalPoints", "desc")
      );
    } else {
      return [];
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
  },

  async searchUsers(searchQuery: string) {
    const q = query(
      collection(db, USERS_COL),
      where("isPrivate", "==", false),
      limit(20)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
    
    if (!searchQuery) return results;
    
    return results.filter(u => 
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },

  async createSquad(userId: string, data: { name: string, description: string, isPrivate: boolean }) {
    try {
    const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const squadRef = doc(collection(db, SQUADS_COL));
    
    const squad: Squad = {
      name: data.name,
      description: data.description,
      leaderId: userId,
      memberIds: [userId],
      isPrivate: data.isPrivate,
      totalPoints: 0,
      createdAt: serverTimestamp()
    };

    if (data.isPrivate) {
      squad.accessCode = accessCode;
    }
    
    const batch = writeBatch(db);
    batch.set(squadRef, squad);
    
    // Add squadId to user
    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      const squadIds = [...(userData.squadIds || []), squadRef.id!];
      batch.update(userRef, { squadIds });
    }
    
    await batch.commit();
    return { id: squadRef.id, ...squad };
    } catch (error) {
      console.error("Error creating squad:", error);
      throw error;
    }
  },

  async joinSquad(userId: string, accessCode: string) {
    const q = query(collection(db, SQUADS_COL), where("accessCode", "==", accessCode.toUpperCase()), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Invalid access code.");
    
    const squadDoc = snap.docs[0];
    const squadData = squadDoc.data() as Squad;
    
    if (squadData.memberIds.includes(userId)) return { id: squadDoc.id, ...squadData };

    const batch = writeBatch(db);
    batch.update(squadDoc.ref, {
      memberIds: [...squadData.memberIds, userId]
    });

    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const squadIds = [...(userSnap.data().squadIds || []), squadDoc.id];
      batch.update(userRef, { squadIds });
    }

    await batch.commit();
    return { id: squadDoc.id, ...squadData };
  },

  async getSquads(userId: string) {
    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || !userSnap.data().squadIds?.length) return [];
    
    const squadIds = userSnap.data().squadIds as string[];
    // Again, 'in' query limit is 10
    const q = query(collection(db, SQUADS_COL), where("__name__", "in", squadIds.slice(0, 10)));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Squad));
  },

  async createPost(post: Omit<CommunityPost, "id" | "createdAt" | "likes">) {
    const postRef = collection(db, POSTS_COL);
    const newPost = {
      ...post,
      likes: [],
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(postRef, newPost);
    return { id: docRef.id, ...newPost };
  },

  async getCommunityFeed(squadId?: string) {
    let q;
    if (squadId) {
      q = query(
        collection(db, POSTS_COL), 
        where("squadId", "==", squadId),
        orderBy("createdAt", "desc"), 
        limit(30)
      );
    } else {
      q = query(collection(db, POSTS_COL), orderBy("createdAt", "desc"), limit(30));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost));
  },

  async toggleLike(postId: string, userId: string) {
    const postRef = doc(db, POSTS_COL, postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    
    const likes = (postSnap.data().likes || []) as string[];
    const isLiked = likes.includes(userId);
    
    if (isLiked) {
      await updateDoc(postRef, {
        likes: likes.filter(id => id !== userId)
      });
    } else {
      await updateDoc(postRef, {
        likes: [...likes, userId]
      });
    }
  },

  async getTopSquads(queryLimit: number = 5) {
    const q = query(
      collection(db, SQUADS_COL),
      where("isPrivate", "==", false),
      orderBy("totalPoints", "desc"),
      limit(queryLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Squad));
  },

  async joinSquadById(userId: string, squadId: string) {
    const docRef = doc(db, SQUADS_COL, squadId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Squad not found.");
    
    const squadData = snap.data() as Squad;
    if (squadData.isPrivate) throw new Error("This squad is private. Use an access code.");
    if (squadData.memberIds.includes(userId)) return { id: snap.id, ...squadData };

    const batch = writeBatch(db);
    batch.update(docRef, {
      memberIds: [...squadData.memberIds, userId]
    });

    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const squadIds = [...(userSnap.data().squadIds || []), snap.id];
      batch.update(userRef, { squadIds });
    }

    await batch.commit();
    return { id: snap.id, ...squadData };
  },

  async searchSquads(searchQuery: string) {
    const q = query(
      collection(db, SQUADS_COL),
      where("isPrivate", "==", false),
      limit(20)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Squad));
    
    if (!searchQuery) return results;
    
    return results.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },

  // Quizzes & Games
  async getRandomQuiz(difficulty: "easy" | "medium" | "hard" = "medium"): Promise<QuizQuestion | null> {
    const q = query(
      collection(db, QUIZZES_COL),
      where("difficulty", "==", difficulty)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) {
      // Seed some initial quizzes if empty
      await this.seedQuizzes(); 
      // Retry fetch
      const retrySnap = await getDocs(q);
      if (retrySnap.empty) return null;
      // Randomly pick one
      const randomIndex = Math.floor(Math.random() * retrySnap.docs.length);
      const doc = retrySnap.docs[randomIndex];
      return { id: doc.id, ...doc.data() } as QuizQuestion;
    }

    const randomIndex = Math.floor(Math.random() * snap.docs.length);
    const doc = snap.docs[randomIndex];
    return { id: doc.id, ...doc.data() } as QuizQuestion;
  },

  async seedQuizzes() {
    const batch = writeBatch(db);
    const quizzes: Omit<QuizQuestion, "id">[] = [
      {
        question: "Which of these takes longest to decompose?",
        options: ["Banana peel", "Paper bag", "Glass bottle", "Wool sock"],
        correctAnswerIndex: 2,
        difficulty: "easy",
        explanation: "Glass can take up to 4,000 years or more to decompose, while others decompose much faster.",
        category: "Waste"
      },
      {
        question: "What percentage of the world's water is drinkable freshwater?",
        options: ["3%", "10%", "50%", "70%"],
        correctAnswerIndex: 0,
        difficulty: "medium",
        explanation: "Only about 3% of Earth's water is freshwater, and most of that is frozen in glaciers.",
        category: "Water"
      },
      {
        question: "Which gas is most responsible for the greenhouse effect?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
        correctAnswerIndex: 1,
        difficulty: "easy",
        explanation: "Carbon dioxide (CO2) is the primary greenhouse gas emitted through human activities.",
        category: "Climate"
      },
      {
        question: "What is the 'Greenhouse Effect'?",
        options: ["Cooling of Earth", "Trapping of heat by atmosphere", "Growth of plants", "Ozone layer depletion"],
        correctAnswerIndex: 1,
        difficulty: "medium",
        explanation: "It is a process where gases in Earth's atmosphere trap the Sun's heat.",
        category: "Climate"
      },
       {
        question: "How much energy does recycling one aluminum can save?",
        options: ["Run a TV for 3 hours", "Charge a phone once", "Light a bulb for 1 minute", "None"],
        correctAnswerIndex: 0,
        difficulty: "hard",
        explanation: "Recycling just one aluminum can saves enough energy to run a 55-inch TV for 3 hours.",
        category: "Energy"
      }
    ];

    quizzes.forEach(q => {
      const ref = doc(collection(db, QUIZZES_COL));
      batch.set(ref, q);
    });
    await batch.commit();
  },

  async submitQuizAnswer(userId: string, questionId: string, answerIndex: number, difficulty: "easy" | "medium" | "hard") {
    const qRef = doc(db, QUIZZES_COL, questionId);
    const qSnap = await getDoc(qRef);
    if (!qSnap.exists()) throw new Error("Question not found");
    
    const question = qSnap.data() as QuizQuestion;
    const isCorrect = question.correctAnswerIndex === answerIndex;
    let pointsEarned = 0;

    if (isCorrect) {
      pointsEarned = difficulty === "easy" ? 1 : difficulty === "medium" ? 3 : 5;
      
      // Calculate streak bonus
      const userRef = doc(db, USERS_COL, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const stats = userSnap.data().quizStats || { currentStreak: 0 };
        const streak = stats.currentStreak || 0;
        pointsEarned += (streak * 2); // 2 points bonus per streak
      }
    }

    const batch = writeBatch(db);
    
    // Log attempt
    const attempt: QuizAttempt = {
      userId,
      questionId,
      isCorrect,
      pointsEarned,
      difficulty,
      createdAt: serverTimestamp()
    };
    batch.set(doc(collection(db, QUIZ_ATTEMPTS_COL)), attempt);

    // Update User Stats
    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentStats = data.quizStats || { totalPlayed: 0, totalCorrect: 0, currentStreak: 0, weeklyScore: 0 };
      
      const newStats = {
        totalPlayed: currentStats.totalPlayed + 1,
        totalCorrect: currentStats.totalCorrect + (isCorrect ? 1 : 0),
        currentStreak: isCorrect ? currentStats.currentStreak + 1 : 0,
        weeklyScore: currentStats.weeklyScore + pointsEarned
      };

      // Also update total points and weekly points
      const currentTotal = data.totalPoints || 0;
      const currentWeekly = data.weeklyPoints || 0;

      batch.update(userRef, {
        quizStats: newStats,
        totalPoints: currentTotal + pointsEarned,
        weeklyPoints: currentWeekly + pointsEarned
      });
    }

    await batch.commit();
    
    if (isCorrect) {
        await this.checkAndAwardAchievements(userId);
    }
    
    return { isCorrect, pointsEarned, explanation: question.explanation };
  },

  async submitGameScore(userId: string, gameId: string, score: number) {
    const batch = writeBatch(db);
    
    // Log Session
    const session: GameSession = {
      userId,
      gameId,
      score,
      completedAt: serverTimestamp()
    };
    batch.set(doc(collection(db, GAME_SESSIONS_COL)), session);

    // Update User Stats & Last Played
    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentTotal = data.totalPoints || 0;
      const currentWeekly = data.weeklyPoints || 0;
      
      // Update high score for this game if applicable
      const currentHighScores = data.highScores || {};
      const previousHighScore = currentHighScores[gameId] || 0;
      const newHighScores = { ...currentHighScores };
      
      if (score > previousHighScore) {
        newHighScores[gameId] = score;
      }
      
      batch.update(userRef, {
        totalPoints: currentTotal + score,
        weeklyPoints: currentWeekly + score,
        [`lastGamePlayedAt.${gameId}`]: serverTimestamp(),
        highScores: newHighScores
      });
    }

    await batch.commit();
    await this.checkAndAwardAchievements(userId);
  },

  async checkGameCooldown(userId: string, gameId: string): Promise<{ canPlay: boolean, timeLeft?: number }> {
    const userSnap = await getDoc(doc(db, USERS_COL, userId));
    if (!userSnap.exists()) return { canPlay: true };

    const data = userSnap.data();
    const lastPlayed = data.lastGamePlayedAt?.[gameId];
    
    if (!lastPlayed) return { canPlay: true };

    // 5 minutes cooldown
    const cooldownMs = 5 * 60 * 1000; 
    const now = Date.now();
    const lastPlayedTime = lastPlayed.toMillis ? lastPlayed.toMillis() : Date.parse(lastPlayed); // Handle Firestore Timestamp or Date string
    
    const diff = now - lastPlayedTime;
    
    if (diff < cooldownMs) {
      return { 
        canPlay: false, 
        timeLeft: Math.ceil((cooldownMs - diff) / 1000) 
      };
    }
    
    return { canPlay: true };
  }
};
