export interface AdminProfile {
  id: string;
  email: string;
  displayName: string;
}

export interface FamilySettings {
  familyName: string;
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  timezone: string;
  defaultWeeklyGoal: number;
  allowNegativePoints: boolean;
  defaultRequireApproval: boolean;
  leaderboardEnabled: boolean;
  rewardsEnabled: boolean;
  rewardsDeductPoints: boolean;
}

export interface Child {
  id: string;
  name: string;
  nickname?: string;
  avatar: string;
  color: string;
  age?: number;
  notes?: string;
  weeklyGoal?: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskCategory =
  | 'homework'
  | 'cleaning'
  | 'helping'
  | 'responsibility'
  | 'habits'
  | 'kindness'
  | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedChildIds: string[]; // ['*'] for all or array of child IDs
  points: number;
  category: TaskCategory;
  dueDate?: string;
  dueTime?: string;
  repeatSchedule: 'once' | 'daily' | 'weekdays' | 'weekends' | 'weekly';
  requireApproval: boolean;
  repeatable: boolean;
  active: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  childId: string;
  date: string; // YYYY-MM-DD
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  pointsAwarded: number;
  notes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export type TransactionType =
  | 'task_completion'
  | 'manual_award'
  | 'correction'
  | 'reward_redemption'
  | 'bonus';

export interface PointTransaction {
  id: string;
  childId: string;
  points: number;
  type: TransactionType;
  reason: string;
  taskId?: string;
  completionId?: string;
  rewardId?: string;
  redemptionId?: string;
  referenceTransactionId?: string;
  timestamp: string;
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  pointsRequired: number;
  icon: string;
  active: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  childId: string;
  pointsSpent: number;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  notes?: string;
  requestedAt: string;
  fulfilledAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  childId?: string;
  timestamp: string;
}

export interface FamilyState {
  settings: FamilySettings;
  children: Child[];
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  pointTransactions: PointTransaction[];
  rewards: Reward[];
  redemptions: RewardRedemption[];
  auditLogs: AuditLog[];
}
