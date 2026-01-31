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
  limit
} from "firebase/firestore";
import { DailyEntry, Challenge, UserProfile, EnvironmentalImpact, FriendRequest, Habit, Achievement } from "./types";
import { mailService } from "./mail.service";

// Collections
const ENTRIES_COL = "dailyEntries";
const CHALLENGES_COL = "challenges";
const USERS_COL = "users";
const REQUESTS_COL = "friendRequests";

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
    if (userSnap.exists()) {
      const currentPoints = userSnap.data().totalPoints || 0;
      batch.update(userRef, { totalPoints: currentPoints + pointDiff });
    } else {
      batch.set(userRef, {
        totalPoints: entry.points,
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
    return snap.exists() ? (snap.data() as UserProfile) : null;
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
  async searchUsers(searchTerm: string) {
    // Basic search (case-sensitive start with) 
    if (!searchTerm) return [];
    const q = query(
      collection(db, USERS_COL),
      where("displayName", ">=", searchTerm),
      where("displayName", "<=", searchTerm + "\uf8ff"),
      where("isPrivate", "==", false),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
  },

  async getGlobalLeaderboard(limitCount: number = 10) {
    const q = query(
      collection(db, USERS_COL),
      where("isPrivate", "==", false),
      orderBy("totalPoints", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
  },

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

  async handleFriendRequest(request: FriendRequest, action: "accepted" | "declined") {
    const batch = writeBatch(db);
    const requestRef = doc(db, REQUESTS_COL, request.id!);
    batch.update(requestRef, { status: action });

    if (action === "accepted") {
      const userRef = doc(db, USERS_COL, request.toId);
      const friendRef = doc(db, USERS_COL, request.fromId);
      
      const userSnap = await getDoc(userRef);
      const friendSnap = await getDoc(friendRef);
      
      if (userSnap.exists() && friendSnap.exists()) {
        const userFriends = userSnap.data().friends || [];
        const friendFriends = friendSnap.data().friends || [];
        
        batch.update(userRef, { friends: [...userFriends, request.fromId] });
        batch.update(friendRef, { friends: [...friendFriends, request.toId] });
        
        // Notify
        if (friendSnap.data().emailNotifications) {
          await mailService.notifyFriendAccepted(friendSnap.data().email, userSnap.data().displayName);
        }
      }
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
  }
};
