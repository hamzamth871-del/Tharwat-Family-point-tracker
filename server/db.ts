import fs from 'fs';
import path from 'path';

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface FamilySettings {
  familyName: string;
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday (default)
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
  avatar: string; // Emoji or icon key
  color: string;
  age?: number;
  notes?: string;
  weeklyGoal?: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedChildIds: string[]; // ['*'] for all children or specific child IDs
  points: number;
  category: 'homework' | 'cleaning' | 'helping' | 'responsibility' | 'habits' | 'kindness' | 'other';
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

export interface PointTransaction {
  id: string;
  childId: string;
  points: number; // positive or negative
  type: 'task_completion' | 'manual_award' | 'correction' | 'reward_redemption' | 'bonus';
  reason: string;
  taskId?: string;
  completionId?: string;
  rewardId?: string;
  redemptionId?: string;
  referenceTransactionId?: string; // For corrections / reversals
  timestamp: string; // ISO string
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

export interface DatabaseSchema {
  admin: AdminUser | null;
  jwtSecret: string;
  settings: FamilySettings;
  children: Child[];
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  pointTransactions: PointTransaction[];
  rewards: Reward[];
  redemptions: RewardRedemption[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'family_points_db.json');

const DEFAULT_SETTINGS: FamilySettings = {
  familyName: 'Our Family',
  weekStartDay: 1, // Monday
  timezone: 'UTC',
  defaultWeeklyGoal: 50,
  allowNegativePoints: true,
  defaultRequireApproval: true,
  leaderboardEnabled: true,
  rewardsEnabled: true,
  rewardsDeductPoints: true,
};

function generateRandomKey(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as Partial<DatabaseSchema>;
        return {
          admin: parsed.admin || null,
          jwtSecret: parsed.jwtSecret || generateRandomKey(48),
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          children: parsed.children || [],
          tasks: parsed.tasks || [],
          taskCompletions: parsed.taskCompletions || [],
          pointTransactions: parsed.pointTransactions || [],
          rewards: parsed.rewards || [],
          redemptions: parsed.redemptions || [],
          auditLogs: parsed.auditLogs || [],
        };
      }
    } catch (err) {
      console.error('Failed to read database file, initializing fresh:', err);
    }

    const initialData: DatabaseSchema = {
      admin: null,
      jwtSecret: generateRandomKey(48),
      settings: DEFAULT_SETTINGS,
      children: [],
      tasks: [],
      taskCompletions: [],
      pointTransactions: [],
      rewards: [],
      redemptions: [],
      auditLogs: [],
    };
    this.saveDirect(initialData);
    return initialData;
  }

  private saveDirect(data: DatabaseSchema) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save() {
    this.saveDirect(this.data);
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public set(newData: DatabaseSchema) {
    this.data = newData;
    this.save();
  }

  public logAudit(action: string, details: string, childId?: string) {
    const entry: AuditLog = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      action,
      details,
      childId,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
  }
}

export const db = new Database();
