import bcrypt from 'bcryptjs';
import {
  FamilyState,
  FamilySettings,
  Child,
  Task,
  TaskCompletion,
  PointTransaction,
  Reward,
  RewardRedemption,
  AuditLog,
  AdminProfile,
} from '../types';

interface LocalDbSchema {
  admin: {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    createdAt: string;
  } | null;
  settings: FamilySettings;
  children: Child[];
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  pointTransactions: PointTransaction[];
  rewards: Reward[];
  redemptions: RewardRedemption[];
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'family_points_local_db_v1';
const SESSION_KEY = 'family_points_local_session';

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

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

class LocalDatabase {
  private data: LocalDbSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): LocalDbSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          admin: parsed.admin || null,
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
    } catch (e) {
      console.error('Error loading local DB:', e);
    }

    return {
      admin: null,
      settings: DEFAULT_SETTINGS,
      children: [],
      tasks: [],
      taskCompletions: [],
      pointTransactions: [],
      rewards: [],
      redemptions: [],
      auditLogs: [],
    };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving local DB:', e);
    }
  }

  public logAudit(action: string, details: string, childId?: string) {
    const entry: AuditLog = {
      id: genId('audit'),
      action,
      details,
      childId,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
  }

  // Session
  public getSession(): { adminId: string; email: string } | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  }

  public setSession(admin: { id: string; email: string }) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ adminId: admin.id, email: admin.email }));
  }

  public clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  public verifyAdmin(): AdminProfile {
    const session = this.getSession();
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('family_points_jwt') : null;
    const tokenAdminId = token && token.startsWith('local_token_') ? token.replace('local_token_', '') : null;
    const adminId = session?.adminId || tokenAdminId;

    if (!adminId || !this.data.admin || (this.data.admin.id !== adminId && this.data.admin.id !== session?.adminId)) {
      throw new Error('Authentication required. Please log in.');
    }
    return {
      id: this.data.admin.id,
      email: this.data.admin.email,
      displayName: this.data.admin.displayName,
    };
  }

  // --- Auth API ---
  public async getStatus() {
    return {
      isSetup: !!this.data.admin,
      familyName: this.data.settings.familyName,
      adminEmail: this.data.admin ? this.data.admin.email : null,
    };
  }

  public async setupOwner(payload: { email: string; password: string; displayName?: string; familyName?: string }) {
    if (this.data.admin) {
      throw new Error('Administrator already configured. Public registration is closed.');
    }

    if (!payload.email || !payload.email.includes('@')) {
      throw new Error('A valid email address is required.');
    }

    if (!payload.password || payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(payload.password, salt);
    const newAdmin = {
      id: genId('admin'),
      email: payload.email.trim().toLowerCase(),
      passwordHash,
      displayName: payload.displayName?.trim() || 'Mom',
      createdAt: new Date().toISOString(),
    };

    this.data.admin = newAdmin;
    if (payload.familyName?.trim()) {
      this.data.settings.familyName = payload.familyName.trim();
    }
    this.save();
    this.setSession(newAdmin);
    this.logAudit('OWNER_INITIALIZED', `Administrator account setup completed for ${newAdmin.email}`);

    return {
      token: 'local_token_' + newAdmin.id,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        displayName: newAdmin.displayName,
      },
      settings: this.data.settings,
    };
  }

  public async login(payload: { email: string; password: string }) {
    if (!this.data.admin) {
      throw new Error('App is not set up yet. Please complete initial setup.');
    }

    const emailMatch = payload.email.trim().toLowerCase() === this.data.admin.email.toLowerCase();
    const passMatch = emailMatch && bcrypt.compareSync(payload.password, this.data.admin.passwordHash);

    if (!passMatch) {
      throw new Error('Invalid email or password.');
    }

    this.setSession(this.data.admin);
    this.logAudit('ADMIN_LOGIN', `Administrator ${this.data.admin.email} logged in`);

    return {
      token: 'local_token_' + this.data.admin.id,
      admin: {
        id: this.data.admin.id,
        email: this.data.admin.email,
        displayName: this.data.admin.displayName,
      },
      settings: this.data.settings,
    };
  }

  public async getMe() {
    const admin = this.verifyAdmin();
    return {
      admin,
      settings: this.data.settings,
    };
  }

  public async changePassword(cur: string, next: string) {
    this.verifyAdmin();
    if (!this.data.admin || !bcrypt.compareSync(cur, this.data.admin.passwordHash)) {
      throw new Error('Current password is incorrect.');
    }
    if (!next || next.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    const salt = bcrypt.genSaltSync(10);
    this.data.admin.passwordHash = bcrypt.hashSync(next, salt);
    this.save();
    this.logAudit('PASSWORD_CHANGED', 'Administrator updated password');
    return { message: 'Password updated successfully.' };
  }

  public async updateProfile(displayName: string, email: string) {
    this.verifyAdmin();
    if (this.data.admin) {
      if (displayName.trim()) this.data.admin.displayName = displayName.trim();
      if (email.includes('@')) this.data.admin.email = email.trim().toLowerCase();
      this.save();
      this.logAudit('PROFILE_UPDATED', 'Administrator profile updated');
      return {
        admin: {
          id: this.data.admin.id,
          email: this.data.admin.email,
          displayName: this.data.admin.displayName,
        },
        message: 'Profile updated successfully.',
      };
    }
    throw new Error('Admin not found');
  }

  public async logout() {
    this.clearSession();
  }

  // --- Family State ---
  public async getFamilyState(): Promise<FamilyState> {
    this.verifyAdmin();
    return {
      settings: this.data.settings,
      children: this.data.children,
      tasks: this.data.tasks,
      taskCompletions: this.data.taskCompletions,
      pointTransactions: this.data.pointTransactions,
      rewards: this.data.rewards,
      redemptions: this.data.redemptions,
      auditLogs: this.data.auditLogs.slice(0, 200),
    };
  }

  // --- Children ---
  public async addChild(data: Partial<Child>) {
    this.verifyAdmin();
    if (!data.name || !data.name.trim()) {
      throw new Error("Child's name is required.");
    }
    const newChild: Child = {
      id: genId('child'),
      name: data.name.trim(),
      nickname: data.nickname?.trim() || undefined,
      avatar: data.avatar || '👦',
      color: data.color || '#43b879',
      age: data.age ? Number(data.age) : undefined,
      notes: data.notes?.trim() || undefined,
      weeklyGoal: data.weeklyGoal ? Number(data.weeklyGoal) : this.data.settings.defaultWeeklyGoal,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.children.push(newChild);
    this.save();
    this.logAudit('CHILD_ADDED', `Added child ${newChild.name}`, newChild.id);
    return { child: newChild, message: `${newChild.name} added to the family!` };
  }

  public async updateChild(id: string, data: Partial<Child>) {
    this.verifyAdmin();
    const child = this.data.children.find(c => c.id === id);
    if (!child) throw new Error('Child not found.');
    if (data.name?.trim()) child.name = data.name.trim();
    if (data.nickname !== undefined) child.nickname = data.nickname?.trim() || undefined;
    if (data.avatar !== undefined) child.avatar = data.avatar;
    if (data.color !== undefined) child.color = data.color;
    if (data.age !== undefined) child.age = data.age ? Number(data.age) : undefined;
    if (data.notes !== undefined) child.notes = data.notes?.trim() || undefined;
    if (data.weeklyGoal !== undefined) child.weeklyGoal = Number(data.weeklyGoal);
    if (data.archived !== undefined) child.archived = Boolean(data.archived);
    child.updatedAt = new Date().toISOString();
    this.save();
    this.logAudit('CHILD_UPDATED', `Updated details for ${child.name}`, child.id);
    return { child, message: 'Child profile updated.' };
  }

  public async archiveChild(id: string, archive?: boolean) {
    this.verifyAdmin();
    const child = this.data.children.find(c => c.id === id);
    if (!child) throw new Error('Child not found.');
    child.archived = archive !== undefined ? Boolean(archive) : !child.archived;
    child.updatedAt = new Date().toISOString();
    this.save();
    this.logAudit(
      child.archived ? 'CHILD_ARCHIVED' : 'CHILD_RESTORED',
      `${child.name} was ${child.archived ? 'archived' : 'restored'}`,
      child.id
    );
    return { child, message: `${child.name} ${child.archived ? 'archived' : 'restored'}.` };
  }

  // --- Tasks ---
  public async createTask(data: Partial<Task>) {
    this.verifyAdmin();
    if (!data.title?.trim()) throw new Error('Task title is required.');
    const points = Number(data.points);
    if (isNaN(points) || points <= 0) throw new Error('Points must be a positive number.');

    const newTask: Task = {
      id: genId('task'),
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      assignedChildIds: Array.isArray(data.assignedChildIds) && data.assignedChildIds.length > 0 ? data.assignedChildIds : ['*'],
      points: Math.round(points),
      category: data.category || 'helping',
      dueDate: data.dueDate || undefined,
      dueTime: data.dueTime || undefined,
      repeatSchedule: data.repeatSchedule || 'daily',
      requireApproval: data.requireApproval !== undefined ? Boolean(data.requireApproval) : this.data.settings.defaultRequireApproval,
      repeatable: Boolean(data.repeatable),
      active: true,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.tasks.push(newTask);
    this.save();
    this.logAudit('TASK_CREATED', `Created task "${newTask.title}" (${newTask.points} pts)`);
    return { task: newTask, message: `Task "${newTask.title}" created.` };
  }

  public async updateTask(id: string, data: Partial<Task>) {
    this.verifyAdmin();
    const task = this.data.tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found.');

    if (data.title?.trim()) task.title = data.title.trim();
    if (data.description !== undefined) task.description = data.description?.trim() || undefined;
    if (data.assignedChildIds !== undefined) task.assignedChildIds = data.assignedChildIds;
    if (data.points !== undefined && Number(data.points) > 0) task.points = Math.round(Number(data.points));
    if (data.category !== undefined) task.category = data.category;
    if (data.dueDate !== undefined) task.dueDate = data.dueDate || undefined;
    if (data.dueTime !== undefined) task.dueTime = data.dueTime || undefined;
    if (data.repeatSchedule !== undefined) task.repeatSchedule = data.repeatSchedule;
    if (data.requireApproval !== undefined) task.requireApproval = Boolean(data.requireApproval);
    if (data.repeatable !== undefined) task.repeatable = Boolean(data.repeatable);
    if (data.active !== undefined) task.active = Boolean(data.active);
    if (data.archived !== undefined) task.archived = Boolean(data.archived);
    task.updatedAt = new Date().toISOString();
    this.save();
    this.logAudit('TASK_UPDATED', `Updated task "${task.title}"`);
    return { task, message: 'Task updated.' };
  }

  public async duplicateTask(id: string) {
    this.verifyAdmin();
    const original = this.data.tasks.find(t => t.id === id);
    if (!original) throw new Error('Task not found.');

    const duplicated: Task = {
      ...original,
      id: genId('task'),
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.tasks.push(duplicated);
    this.save();
    this.logAudit('TASK_DUPLICATED', `Duplicated task "${original.title}"`);
    return { task: duplicated, message: 'Task duplicated.' };
  }

  public async archiveTask(id: string, archive?: boolean) {
    this.verifyAdmin();
    const task = this.data.tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found.');
    task.archived = archive !== undefined ? Boolean(archive) : !task.archived;
    task.updatedAt = new Date().toISOString();
    this.save();
    this.logAudit('TASK_ARCHIVED', `Task "${task.title}" was ${task.archived ? 'archived' : 'restored'}`);
    return { task, message: `Task ${task.archived ? 'archived' : 'restored'}.` };
  }

  // --- Completions & Approvals ---
  public async completeTask(taskId: string, childId: string, date?: string, notes?: string) {
    this.verifyAdmin();
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found.');
    const child = this.data.children.find(c => c.id === childId);
    if (!child) throw new Error('Child not found.');

    const todayStr = date || new Date().toISOString().split('T')[0];

    if (!task.repeatable) {
      const existing = this.data.taskCompletions.find(
        c => c.taskId === task.id && c.childId === child.id && c.date === todayStr && c.status !== 'rejected'
      );
      if (existing) {
        throw new Error(`This task has already been recorded for ${child.name} on ${todayStr}.`);
      }
    }

    const completionId = genId('comp');

    if (task.requireApproval) {
      const completion: TaskCompletion = {
        id: completionId,
        taskId: task.id,
        childId: child.id,
        date: todayStr,
        status: 'pending',
        pointsAwarded: task.points,
        notes: notes?.trim() || undefined,
        submittedAt: new Date().toISOString(),
      };
      this.data.taskCompletions.push(completion);
      this.save();
      this.logAudit(
        'TASK_PENDING_APPROVAL',
        `"${task.title}" marked completed for ${child.name}, waiting for approval`,
        child.id
      );
      return { message: `Task submitted! Waiting for Mom's approval.`, pointsAwarded: false };
    } else {
      const completion: TaskCompletion = {
        id: completionId,
        taskId: task.id,
        childId: child.id,
        date: todayStr,
        status: 'approved',
        pointsAwarded: task.points,
        notes: notes?.trim() || undefined,
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
      };
      const transaction: PointTransaction = {
        id: genId('tx'),
        childId: child.id,
        taskId: task.id,
        completionId,
        points: task.points,
        type: 'task_completion',
        reason: `Completed task: ${task.title}`,
        timestamp: new Date().toISOString(),
      };
      this.data.taskCompletions.push(completion);
      this.data.pointTransactions.push(transaction);
      this.save();
      this.logAudit(
        'TASK_COMPLETED',
        `${child.name} completed "${task.title}" (+${task.points} pts)`,
        child.id
      );
      return { message: `Great job! ${task.points} points awarded to ${child.name}.`, pointsAwarded: true };
    }
  }

  public async approveCompletion(completionId: string) {
    this.verifyAdmin();
    const completion = this.data.taskCompletions.find(c => c.id === completionId);
    if (!completion) throw new Error('Completion record not found.');
    if (completion.status === 'approved') throw new Error('This completion is already approved.');

    const task = this.data.tasks.find(t => t.id === completion.taskId);
    const child = this.data.children.find(c => c.id === completion.childId);

    completion.status = 'approved';
    completion.reviewedAt = new Date().toISOString();

    const transaction: PointTransaction = {
      id: genId('tx'),
      childId: completion.childId,
      taskId: completion.taskId,
      completionId: completion.id,
      points: completion.pointsAwarded,
      type: 'task_completion',
      reason: `Approved: ${task ? task.title : 'Task'}`,
      timestamp: new Date().toISOString(),
    };
    this.data.pointTransactions.push(transaction);
    this.save();
    this.logAudit(
      'TASK_APPROVED',
      `Approved "${task?.title || 'Task'}" for ${child?.name || 'Child'} (+${completion.pointsAwarded} pts)`,
      completion.childId
    );
    return { message: `Approved! +${completion.pointsAwarded} points awarded.` };
  }

  public async rejectCompletion(completionId: string, reason?: string) {
    this.verifyAdmin();
    const completion = this.data.taskCompletions.find(c => c.id === completionId);
    if (!completion) throw new Error('Completion record not found.');

    const task = this.data.tasks.find(t => t.id === completion.taskId);
    const child = this.data.children.find(c => c.id === completion.childId);

    completion.status = 'rejected';
    completion.notes = reason ? `Rejected: ${reason}` : 'Rejected';
    completion.reviewedAt = new Date().toISOString();
    this.save();
    this.logAudit(
      'TASK_REJECTED',
      `Rejected "${task?.title || 'Task'}" for ${child?.name || 'Child'}. Reason: ${reason || 'Not specified'}`,
      completion.childId
    );
    return { message: 'Completion rejected.' };
  }

  // --- Point Ledger ---
  public async awardPoints(data: { childId: string; points: number; reason: string; taskId?: string }) {
    this.verifyAdmin();
    const child = this.data.children.find(c => c.id === data.childId);
    if (!child) throw new Error('Child not found.');
    const p = Math.round(Number(data.points));
    if (isNaN(p) || p <= 0) throw new Error('Points must be a positive number.');
    if (!data.reason?.trim()) throw new Error('Reason is required.');

    const transaction: PointTransaction = {
      id: genId('tx'),
      childId: child.id,
      taskId: data.taskId || undefined,
      points: p,
      type: 'manual_award',
      reason: data.reason.trim(),
      timestamp: new Date().toISOString(),
    };
    this.data.pointTransactions.push(transaction);
    this.save();
    this.logAudit(
      'MANUAL_POINTS_AWARDED',
      `Awarded +${p} pts to ${child.name}. Reason: ${transaction.reason}`,
      child.id
    );
    return { message: `+${p} points awarded to ${child.name}!` };
  }

  public async adjustPoints(data: { childId: string; points: number; reason: string }) {
    this.verifyAdmin();
    const child = this.data.children.find(c => c.id === data.childId);
    if (!child) throw new Error('Child not found.');
    const p = Math.round(Number(data.points));
    if (isNaN(p) || p === 0) throw new Error('Adjustment must be non-zero.');
    if (p < 0 && !this.data.settings.allowNegativePoints) {
      throw new Error('Negative point adjustments are currently disabled in Settings.');
    }
    if (!data.reason?.trim()) throw new Error('Reason is required.');

    const transaction: PointTransaction = {
      id: genId('tx'),
      childId: child.id,
      points: p,
      type: 'correction',
      reason: data.reason.trim(),
      timestamp: new Date().toISOString(),
    };
    this.data.pointTransactions.push(transaction);
    this.save();
    this.logAudit(
      'POINTS_ADJUSTED',
      `Adjusted points for ${child.name} by ${p > 0 ? '+' : ''}${p} pts. Reason: ${data.reason}`,
      child.id
    );
    return { message: `Points adjusted for ${child.name} (${p > 0 ? '+' : ''}${p} pts).` };
  }

  public async reverseTransaction(transactionId: string, reason?: string) {
    this.verifyAdmin();
    const original = this.data.pointTransactions.find(t => t.id === transactionId);
    if (!original) throw new Error('Original transaction not found.');

    const child = this.data.children.find(c => c.id === original.childId);
    const offsetPoints = -original.points;

    const reversal: PointTransaction = {
      id: genId('tx'),
      childId: original.childId,
      points: offsetPoints,
      type: 'correction',
      reason: reason?.trim() || `Reversal of transaction (${original.reason})`,
      referenceTransactionId: original.id,
      timestamp: new Date().toISOString(),
    };
    this.data.pointTransactions.push(reversal);
    this.save();
    this.logAudit(
      'TRANSACTION_REVERSED',
      `Reversed transaction for ${child?.name || 'Child'} (${offsetPoints > 0 ? '+' : ''}${offsetPoints} pts)`,
      original.childId
    );
    return { message: 'Transaction reversed successfully. Offset created.' };
  }

  // --- Rewards ---
  public async createReward(data: Partial<Reward>) {
    this.verifyAdmin();
    if (!data.title?.trim()) throw new Error('Reward title is required.');
    const pts = Math.round(Number(data.pointsRequired));
    if (isNaN(pts) || pts <= 0) throw new Error('Points required must be greater than zero.');

    const newReward: Reward = {
      id: genId('reward'),
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      pointsRequired: pts,
      icon: data.icon || '🎁',
      active: true,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.rewards.push(newReward);
    this.save();
    this.logAudit('REWARD_CREATED', `Created reward "${newReward.title}" (${newReward.pointsRequired} pts)`);
    return { reward: newReward, message: 'Reward created.' };
  }

  public async updateReward(id: string, data: Partial<Reward>) {
    this.verifyAdmin();
    const reward = this.data.rewards.find(r => r.id === id);
    if (!reward) throw new Error('Reward not found.');

    if (data.title?.trim()) reward.title = data.title.trim();
    if (data.description !== undefined) reward.description = data.description?.trim() || undefined;
    if (data.pointsRequired !== undefined && Number(data.pointsRequired) > 0) {
      reward.pointsRequired = Math.round(Number(data.pointsRequired));
    }
    if (data.icon !== undefined) reward.icon = data.icon;
    if (data.active !== undefined) reward.active = Boolean(data.active);
    if (data.archived !== undefined) reward.archived = Boolean(data.archived);
    reward.updatedAt = new Date().toISOString();
    this.save();
    this.logAudit('REWARD_UPDATED', `Updated reward "${reward.title}"`);
    return { reward, message: 'Reward updated.' };
  }

  public async archiveReward(id: string, archive?: boolean) {
    this.verifyAdmin();
    const reward = this.data.rewards.find(r => r.id === id);
    if (!reward) throw new Error('Reward not found.');
    reward.archived = archive !== undefined ? Boolean(archive) : !reward.archived;
    reward.updatedAt = new Date().toISOString();
    this.save();
    this.logAudit('REWARD_ARCHIVED', `Reward "${reward.title}" was ${reward.archived ? 'archived' : 'restored'}`);
    return { reward, message: `Reward ${reward.archived ? 'archived' : 'restored'}.` };
  }

  public async redeemReward(rewardId: string, childId: string, notes?: string) {
    this.verifyAdmin();
    const reward = this.data.rewards.find(r => r.id === rewardId);
    if (!reward || reward.archived) throw new Error('Reward not found or no longer available.');
    const child = this.data.children.find(c => c.id === childId);
    if (!child) throw new Error('Child not found.');

    const totalBalance = this.data.pointTransactions
      .filter(t => t.childId === child.id)
      .reduce((sum, t) => sum + t.points, 0);

    const deduct = this.data.settings.rewardsDeductPoints;
    if (deduct && totalBalance < reward.pointsRequired) {
      throw new Error(`${child.name} has ${totalBalance} points, but this reward requires ${reward.pointsRequired} points.`);
    }

    const redemptionId = genId('redemption');
    const redemption: RewardRedemption = {
      id: redemptionId,
      rewardId: reward.id,
      childId: child.id,
      pointsSpent: deduct ? reward.pointsRequired : 0,
      status: 'fulfilled',
      notes: notes?.trim() || undefined,
      requestedAt: new Date().toISOString(),
      fulfilledAt: new Date().toISOString(),
    };
    this.data.redemptions.push(redemption);

    if (deduct) {
      const tx: PointTransaction = {
        id: genId('tx'),
        childId: child.id,
        rewardId: reward.id,
        redemptionId,
        points: -reward.pointsRequired,
        type: 'reward_redemption',
        reason: `Redeemed reward: ${reward.title}`,
        timestamp: new Date().toISOString(),
      };
      this.data.pointTransactions.push(tx);
    }
    this.save();
    this.logAudit(
      'REWARD_REDEEMED',
      `${child.name} redeemed "${reward.title}"${deduct ? ` (-${reward.pointsRequired} pts)` : ''}`,
      child.id
    );
    return { message: `🎉 Reward "${reward.title}" redeemed for ${child.name}!` };
  }

  // --- Settings & Backup ---
  public async updateSettings(settings: Partial<FamilySettings>) {
    this.verifyAdmin();
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    this.logAudit('SETTINGS_UPDATED', 'Family settings updated');
    return { message: 'Settings saved.', settings: this.data.settings };
  }

  public async seedStarterPack() {
    this.verifyAdmin();
    const starterTasks: Task[] = [
      {
        id: genId('task'),
        title: 'Make Bed & Tidy Bedroom',
        description: 'Make bed neatly, pick up clothes, and keep floor clear.',
        assignedChildIds: ['*'],
        points: 5,
        category: 'cleaning',
        repeatSchedule: 'daily',
        requireApproval: true,
        repeatable: false,
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: genId('task'),
        title: 'Complete Homework & Reading',
        description: 'Finish daily school assignments and read for at least 20 minutes.',
        assignedChildIds: ['*'],
        points: 10,
        category: 'homework',
        repeatSchedule: 'weekdays',
        requireApproval: true,
        repeatable: false,
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: genId('task'),
        title: 'Help with Dinner & Table',
        description: 'Help set the dinner table, bring food, and clear dishes afterward.',
        assignedChildIds: ['*'],
        points: 8,
        category: 'helping',
        repeatSchedule: 'daily',
        requireApproval: true,
        repeatable: false,
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: genId('task'),
        title: 'Pack School Bag & Shoes',
        description: 'Pack books, homework folder, water bottle, and place shoes by door.',
        assignedChildIds: ['*'],
        points: 5,
        category: 'responsibility',
        repeatSchedule: 'weekdays',
        requireApproval: false,
        repeatable: false,
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: genId('task'),
        title: 'Brushed Teeth & Morning Routine',
        description: 'Brush teeth for 2 minutes, wash face, and get dressed without reminders.',
        assignedChildIds: ['*'],
        points: 5,
        category: 'habits',
        repeatSchedule: 'daily',
        requireApproval: false,
        repeatable: false,
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: genId('task'),
        title: 'Unprompted Act of Kindness',
        description: 'Helped a sibling, comforted someone, or shared without being asked.',
        assignedChildIds: ['*'],
        points: 10,
        category: 'kindness',
        repeatSchedule: 'daily',
        requireApproval: true,
        repeatable: true,
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const starterRewards: Reward[] = [
      {
        id: genId('reward'),
        title: 'Choose the Family Movie',
        description: 'Pick the movie for Friday or Saturday family movie night.',
        pointsRequired: 30,
        icon: '🍿',
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: genId('reward'),
        title: 'Extra 30 Mins Screen/Gaming Time',
        description: 'Bonus recreation time on weekend or after homework is done.',
        pointsRequired: 25,
        icon: '🎮',
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: genId('reward'),
        title: 'Choose Favorite Dinner',
        description: 'Mom makes your favorite meal or orders your favorite takeout.',
        pointsRequired: 45,
        icon: '🍕',
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: genId('reward'),
        title: 'Weekend Ice Cream Trip',
        description: 'Special trip to the ice cream parlor with Mom.',
        pointsRequired: 50,
        icon: '🍦',
        active: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const st of starterTasks) {
      if (!this.data.tasks.some(t => t.title.toLowerCase() === st.title.toLowerCase())) {
        this.data.tasks.push(st);
      }
    }
    for (const sr of starterRewards) {
      if (!this.data.rewards.some(r => r.title.toLowerCase() === sr.title.toLowerCase())) {
        this.data.rewards.push(sr);
      }
    }
    this.save();
    this.logAudit('STARTER_PACK_LOADED', 'Starter chore tasks and rewards loaded');
    return { message: 'Starter tasks and rewards loaded successfully!' };
  }

  public async exportBackup() {
    this.verifyAdmin();
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      familyName: this.data.settings.familyName,
      settings: this.data.settings,
      children: this.data.children,
      tasks: this.data.tasks,
      taskCompletions: this.data.taskCompletions,
      pointTransactions: this.data.pointTransactions,
      rewards: this.data.rewards,
      redemptions: this.data.redemptions,
      auditLogs: this.data.auditLogs,
    };
  }

  public async importBackup(data: any) {
    this.verifyAdmin();
    if (!data || typeof data !== 'object') throw new Error('Valid backup data is required.');
    if (Array.isArray(data.children)) this.data.children = data.children;
    if (Array.isArray(data.tasks)) this.data.tasks = data.tasks;
    if (Array.isArray(data.taskCompletions)) this.data.taskCompletions = data.taskCompletions;
    if (Array.isArray(data.pointTransactions)) this.data.pointTransactions = data.pointTransactions;
    if (Array.isArray(data.rewards)) this.data.rewards = data.rewards;
    if (Array.isArray(data.redemptions)) this.data.redemptions = data.redemptions;
    if (data.settings && typeof data.settings === 'object') {
      this.data.settings = { ...this.data.settings, ...data.settings };
    }
    this.save();
    this.logAudit('BACKUP_RESTORED', 'Family data restored from backup file');
    return { message: 'Family data successfully restored from backup.' };
  }
}

export const localDb = new LocalDatabase();
