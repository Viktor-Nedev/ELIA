export interface EnvironmentalImpact {
  co2: number;
  water: number;
  energy: number;
  waste: number;
  food: number;
}

export interface AIAnalysisResponse {
  emissions: EnvironmentalImpact;
  points: number;
  comment: string;
  followUpQuestions: string[];
}

export interface DailyEntry {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  rawText: string;
  emissions: {
    co2: number;
    water: number;
    food: number;
    energy?: number;
    waste?: number;
  };
  points: number;
  aiComment: string;
  actions?: string[];
  createdAt?: any;
}

export interface Challenge {
  id?: string;
  userId: string;
  title: string;
  description: string;
  emissionType: keyof EnvironmentalImpact;
  target: number;
  completed: boolean;
  pointsReward: number;
  createdAt: any;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsBonus: number;
  unlockedAt?: any;
}

export interface UserProfile {
  id?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  totalPoints: number;
  badges: string[]; // Maintaining for simple UI
  earnedAchievements?: string[]; // IDs of earned achievements
  friends: string[]; // User IDs
  emailNotifications: boolean;
  isPrivate: boolean;
  suggestedHabits?: Habit[];
  squadIds?: string[];
}

export interface Squad {
  id?: string;
  name: string;
  description: string;
  leaderId: string;
  memberIds: string[];
  isPrivate: boolean;
  accessCode?: string;
  totalPoints: number;
  createdAt: any;
}

export interface CommunityPost {
  id?: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  type: "entry" | "achievement" | "challenge";
  impact?: EnvironmentalImpact;
  likes: string[]; // User IDs
  squadId?: string; // Optional: post to a specific squad
  createdAt: any;
}

export interface FriendRequest {
  id?: string;
  fromId: string;
  fromName: string;
  toId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: any;
}

export interface Habit {
  id?: string;
  title: string;
  description: string;
  impactType: keyof EnvironmentalImpact;
  difficulty: "easy" | "medium" | "hard";
}

export type EmissionType = 'energy' | 'transportation' | 'water' | 'food' | 'waste';