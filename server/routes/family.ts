import { Router, Response } from 'express';
import { db, Child, Task, TaskCompletion, PointTransaction, Reward, RewardRedemption, FamilySettings } from '../db.js';
import { requireAdmin, AuthenticatedRequest } from '../auth.js';

export const familyRouter = Router();

// Apply auth to all family routes
familyRouter.use(requireAdmin);

// Helper to generate IDs
function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ----------------------------------------------------
// COMPLETE FAMILY STATE
// ----------------------------------------------------
familyRouter.get('/state', (_req: AuthenticatedRequest, res: Response) => {
  const currentDb = db.get();
  res.json({
    settings: currentDb.settings,
    children: currentDb.children,
    tasks: currentDb.tasks,
    taskCompletions: currentDb.taskCompletions,
    pointTransactions: currentDb.pointTransactions,
    rewards: currentDb.rewards,
    redemptions: currentDb.redemptions,
    auditLogs: currentDb.auditLogs.slice(0, 200),
  });
});

// ----------------------------------------------------
// CHILDREN MANAGEMENT
// ----------------------------------------------------
familyRouter.post('/children', (req: AuthenticatedRequest, res: Response): void => {
  const { name, nickname, avatar, color, age, notes, weeklyGoal } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: "Child's name is required." });
    return;
  }

  const currentDb = db.get();
  const newChild: Child = {
    id: genId('child'),
    name: name.trim(),
    nickname: nickname?.trim() || undefined,
    avatar: avatar || '👦',
    color: color || '#43B879',
    age: age ? Number(age) : undefined,
    notes: notes?.trim() || undefined,
    weeklyGoal: weeklyGoal ? Number(weeklyGoal) : currentDb.settings.defaultWeeklyGoal,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  currentDb.children.push(newChild);
  db.save();
  db.logAudit('CHILD_ADDED', `Added child ${newChild.name}`, newChild.id);

  res.status(201).json({ message: `${newChild.name} added to the family!`, child: newChild });
});

familyRouter.put('/children/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { name, nickname, avatar, color, age, notes, weeklyGoal, archived } = req.body;
  const currentDb = db.get();

  const childIndex = currentDb.children.findIndex(c => c.id === id);
  if (childIndex === -1) {
    res.status(404).json({ error: 'Child not found.' });
    return;
  }

  const existing = currentDb.children[childIndex];
  if (name && typeof name === 'string' && name.trim().length > 0) {
    existing.name = name.trim();
  }
  if (nickname !== undefined) existing.nickname = nickname?.trim() || undefined;
  if (avatar !== undefined) existing.avatar = avatar;
  if (color !== undefined) existing.color = color;
  if (age !== undefined) existing.age = age ? Number(age) : undefined;
  if (notes !== undefined) existing.notes = notes?.trim() || undefined;
  if (weeklyGoal !== undefined) existing.weeklyGoal = Number(weeklyGoal);
  if (archived !== undefined) existing.archived = Boolean(archived);
  existing.updatedAt = new Date().toISOString();

  db.save();
  db.logAudit('CHILD_UPDATED', `Updated details for ${existing.name}`, existing.id);

  res.json({ message: 'Child profile updated.', child: existing });
});

familyRouter.post('/children/:id/archive', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { archive } = req.body; // boolean
  const currentDb = db.get();

  const child = currentDb.children.find(c => c.id === id);
  if (!child) {
    res.status(404).json({ error: 'Child not found.' });
    return;
  }

  child.archived = archive !== undefined ? Boolean(archive) : !child.archived;
  child.updatedAt = new Date().toISOString();
  db.save();

  db.logAudit(
    child.archived ? 'CHILD_ARCHIVED' : 'CHILD_RESTORED',
    `${child.name} was ${child.archived ? 'archived' : 'restored'}`,
    child.id
  );

  res.json({ message: `${child.name} ${child.archived ? 'archived' : 'restored'}.`, child });
});

// ----------------------------------------------------
// TASK MANAGEMENT
// ----------------------------------------------------
familyRouter.post('/tasks', (req: AuthenticatedRequest, res: Response): void => {
  const {
    title,
    description,
    assignedChildIds,
    points,
    category,
    dueDate,
    dueTime,
    repeatSchedule,
    requireApproval,
    repeatable,
  } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'Task title is required.' });
    return;
  }

  const pointVal = Number(points);
  if (isNaN(pointVal) || pointVal <= 0) {
    res.status(400).json({ error: 'Points must be a positive number.' });
    return;
  }

  const currentDb = db.get();
  const newTask: Task = {
    id: genId('task'),
    title: title.trim(),
    description: description?.trim() || undefined,
    assignedChildIds: Array.isArray(assignedChildIds) && assignedChildIds.length > 0 ? assignedChildIds : ['*'],
    points: Math.round(pointVal),
    category: category || 'helping',
    dueDate: dueDate || undefined,
    dueTime: dueTime || undefined,
    repeatSchedule: repeatSchedule || 'daily',
    requireApproval: requireApproval !== undefined ? Boolean(requireApproval) : currentDb.settings.defaultRequireApproval,
    repeatable: Boolean(repeatable),
    active: true,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  currentDb.tasks.push(newTask);
  db.save();
  db.logAudit('TASK_CREATED', `Created task "${newTask.title}" (${newTask.points} pts)`);

  res.status(201).json({ message: `Task "${newTask.title}" created.`, task: newTask });
});

familyRouter.put('/tasks/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const currentDb = db.get();
  const taskIndex = currentDb.tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const existing = currentDb.tasks[taskIndex];
  const {
    title,
    description,
    assignedChildIds,
    points,
    category,
    dueDate,
    dueTime,
    repeatSchedule,
    requireApproval,
    repeatable,
    active,
    archived,
  } = req.body;

  if (title && typeof title === 'string') existing.title = title.trim();
  if (description !== undefined) existing.description = description?.trim() || undefined;
  if (assignedChildIds !== undefined && Array.isArray(assignedChildIds)) existing.assignedChildIds = assignedChildIds;
  if (points !== undefined) {
    const p = Number(points);
    if (!isNaN(p) && p > 0) existing.points = Math.round(p);
  }
  if (category !== undefined) existing.category = category;
  if (dueDate !== undefined) existing.dueDate = dueDate || undefined;
  if (dueTime !== undefined) existing.dueTime = dueTime || undefined;
  if (repeatSchedule !== undefined) existing.repeatSchedule = repeatSchedule;
  if (requireApproval !== undefined) existing.requireApproval = Boolean(requireApproval);
  if (repeatable !== undefined) existing.repeatable = Boolean(repeatable);
  if (active !== undefined) existing.active = Boolean(active);
  if (archived !== undefined) existing.archived = Boolean(archived);
  existing.updatedAt = new Date().toISOString();

  db.save();
  db.logAudit('TASK_UPDATED', `Updated task "${existing.title}"`);

  res.json({ message: `Task updated.`, task: existing });
});

familyRouter.post('/tasks/:id/duplicate', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const currentDb = db.get();
  const original = currentDb.tasks.find(t => t.id === id);

  if (!original) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const duplicated: Task = {
    ...original,
    id: genId('task'),
    title: `${original.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  currentDb.tasks.push(duplicated);
  db.save();
  db.logAudit('TASK_DUPLICATED', `Duplicated task "${original.title}"`);

  res.status(201).json({ message: `Task duplicated.`, task: duplicated });
});

familyRouter.post('/tasks/:id/archive', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { archive } = req.body;
  const currentDb = db.get();
  const task = currentDb.tasks.find(t => t.id === id);

  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  task.archived = archive !== undefined ? Boolean(archive) : !task.archived;
  task.updatedAt = new Date().toISOString();
  db.save();

  db.logAudit('TASK_ARCHIVED', `Task "${task.title}" was ${task.archived ? 'archived' : 'restored'}`);

  res.json({ message: `Task ${task.archived ? 'archived' : 'restored'}.`, task });
});

// ----------------------------------------------------
// TASK COMPLETION & APPROVAL WORKFLOW
// ----------------------------------------------------
familyRouter.post('/tasks/:id/complete', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { childId, date, notes } = req.body;

  if (!childId) {
    res.status(400).json({ error: 'Child ID is required.' });
    return;
  }

  const currentDb = db.get();
  const task = currentDb.tasks.find(t => t.id === id);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const child = currentDb.children.find(c => c.id === childId);
  if (!child) {
    res.status(404).json({ error: 'Child not found.' });
    return;
  }

  const todayStr = date || new Date().toISOString().split('T')[0];

  // Prevent duplicate completion if task is not repeatable on the same date
  if (!task.repeatable) {
    const existingCompletion = currentDb.taskCompletions.find(
      c => c.taskId === task.id && c.childId === child.id && c.date === todayStr && c.status !== 'rejected'
    );
    if (existingCompletion) {
      res.status(400).json({
        error: `This task has already been recorded for ${child.name} on ${todayStr}.`,
      });
      return;
    }
  }

  const completionId = genId('comp');

  if (task.requireApproval) {
    // Requires mom's approval before points are awarded
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

    currentDb.taskCompletions.push(completion);
    db.save();
    db.logAudit(
      'TASK_PENDING_APPROVAL',
      `"${task.title}" marked completed for ${child.name}, waiting for approval`,
      child.id
    );

    res.json({
      message: `Task submitted! Waiting for Mom's approval.`,
      completion,
      pointsAwarded: false,
    });
  } else {
    // Approved immediately and points awarded directly
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

    currentDb.taskCompletions.push(completion);
    currentDb.pointTransactions.push(transaction);
    db.save();

    db.logAudit(
      'TASK_COMPLETED',
      `${child.name} completed "${task.title}" (+${task.points} pts)`,
      child.id
    );

    res.json({
      message: `Great job! ${task.points} points awarded to ${child.name}.`,
      completion,
      transaction,
      pointsAwarded: true,
    });
  }
});

familyRouter.post('/completions/:id/approve', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const currentDb = db.get();

  const completion = currentDb.taskCompletions.find(c => c.id === id);
  if (!completion) {
    res.status(404).json({ error: 'Completion record not found.' });
    return;
  }

  if (completion.status === 'approved') {
    res.status(400).json({ error: 'This task completion has already been approved.' });
    return;
  }

  const task = currentDb.tasks.find(t => t.id === completion.taskId);
  const child = currentDb.children.find(c => c.id === completion.childId);
  const childName = child ? child.name : 'Child';
  const taskTitle = task ? task.title : 'Task';

  completion.status = 'approved';
  completion.reviewedAt = new Date().toISOString();

  // Create point transaction
  const transaction: PointTransaction = {
    id: genId('tx'),
    childId: completion.childId,
    taskId: completion.taskId,
    completionId: completion.id,
    points: completion.pointsAwarded,
    type: 'task_completion',
    reason: `Approved: ${taskTitle}`,
    timestamp: new Date().toISOString(),
  };

  currentDb.pointTransactions.push(transaction);
  db.save();

  db.logAudit(
    'TASK_APPROVED',
    `Approved "${taskTitle}" for ${childName} (+${completion.pointsAwarded} pts)`,
    completion.childId
  );

  res.json({
    message: `Approved! +${completion.pointsAwarded} points awarded to ${childName}.`,
    completion,
    transaction,
  });
});

familyRouter.post('/completions/:id/reject', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { reason } = req.body;
  const currentDb = db.get();

  const completion = currentDb.taskCompletions.find(c => c.id === id);
  if (!completion) {
    res.status(404).json({ error: 'Completion record not found.' });
    return;
  }

  const child = currentDb.children.find(c => c.id === completion.childId);
  const task = currentDb.tasks.find(t => t.id === completion.taskId);
  const childName = child ? child.name : 'Child';
  const taskTitle = task ? task.title : 'Task';

  completion.status = 'rejected';
  completion.notes = reason ? `Rejected: ${reason}` : 'Rejected';
  completion.reviewedAt = new Date().toISOString();

  db.save();
  db.logAudit(
    'TASK_REJECTED',
    `Rejected "${taskTitle}" for ${childName}. Reason: ${reason || 'Not specified'}`,
    completion.childId
  );

  res.json({ message: `Completion rejected.`, completion });
});

// ----------------------------------------------------
// POINT LEDGER & MANUAL ADJUSTMENTS
// ----------------------------------------------------
familyRouter.post('/points/award', (req: AuthenticatedRequest, res: Response): void => {
  const { childId, points, reason, taskId } = req.body;

  if (!childId) {
    res.status(400).json({ error: 'Child selection is required.' });
    return;
  }

  const p = Number(points);
  if (isNaN(p) || p <= 0) {
    res.status(400).json({ error: 'Points must be a positive number.' });
    return;
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ error: 'A reason for awarding points is required.' });
    return;
  }

  const currentDb = db.get();
  const child = currentDb.children.find(c => c.id === childId);
  if (!child) {
    res.status(404).json({ error: 'Child not found.' });
    return;
  }

  const transaction: PointTransaction = {
    id: genId('tx'),
    childId: child.id,
    taskId: taskId || undefined,
    points: Math.round(p),
    type: 'manual_award',
    reason: reason.trim(),
    timestamp: new Date().toISOString(),
  };

  currentDb.pointTransactions.push(transaction);
  db.save();

  db.logAudit(
    'MANUAL_POINTS_AWARDED',
    `Awarded +${transaction.points} pts to ${child.name}. Reason: ${transaction.reason}`,
    child.id
  );

  res.status(201).json({
    message: `+${transaction.points} points awarded to ${child.name}!`,
    transaction,
  });
});

familyRouter.post('/points/adjust', (req: AuthenticatedRequest, res: Response): void => {
  const { childId, points, reason } = req.body;

  if (!childId) {
    res.status(400).json({ error: 'Child selection is required.' });
    return;
  }

  const p = Number(points);
  if (isNaN(p) || p === 0) {
    res.status(400).json({ error: 'Adjustment points must be non-zero.' });
    return;
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ error: 'A reason for point adjustment is required.' });
    return;
  }

  const currentDb = db.get();
  if (p < 0 && !currentDb.settings.allowNegativePoints) {
    res.status(400).json({
      error: 'Negative point adjustments are currently disabled in Settings.',
    });
    return;
  }

  const child = currentDb.children.find(c => c.id === childId);
  if (!child) {
    res.status(404).json({ error: 'Child not found.' });
    return;
  }

  const transaction: PointTransaction = {
    id: genId('tx'),
    childId: child.id,
    points: Math.round(p),
    type: 'correction',
    reason: reason.trim(),
    timestamp: new Date().toISOString(),
  };

  currentDb.pointTransactions.push(transaction);
  db.save();

  db.logAudit(
    'POINTS_ADJUSTED',
    `Adjusted points for ${child.name} by ${p > 0 ? '+' : ''}${p} pts. Reason: ${reason}`,
    child.id
  );

  res.json({
    message: `Points adjusted for ${child.name} (${p > 0 ? '+' : ''}${p} pts).`,
    transaction,
  });
});

// Reversal / Undo of a specific point transaction
familyRouter.post('/points/reverse', (req: AuthenticatedRequest, res: Response): void => {
  const { transactionId, reason } = req.body;

  if (!transactionId) {
    res.status(400).json({ error: 'Transaction ID is required.' });
    return;
  }

  const currentDb = db.get();
  const original = currentDb.pointTransactions.find(t => t.id === transactionId);

  if (!original) {
    res.status(404).json({ error: 'Original transaction not found.' });
    return;
  }

  const child = currentDb.children.find(c => c.id === original.childId);
  const childName = child ? child.name : 'Child';

  // Offset points (reversal)
  const offsetPoints = -original.points;

  const reversalTransaction: PointTransaction = {
    id: genId('tx'),
    childId: original.childId,
    points: offsetPoints,
    type: 'correction',
    reason: reason?.trim() || `Reversal of transaction (${original.reason})`,
    referenceTransactionId: original.id,
    timestamp: new Date().toISOString(),
  };

  currentDb.pointTransactions.push(reversalTransaction);
  db.save();

  db.logAudit(
    'TRANSACTION_REVERSED',
    `Reversed transaction ${original.id} for ${childName} (${offsetPoints > 0 ? '+' : ''}${offsetPoints} pts)`,
    original.childId
  );

  res.json({
    message: `Transaction reversed successfully. Offset created.`,
    transaction: reversalTransaction,
  });
});

// ----------------------------------------------------
// REWARDS STORE & REDEMPTIONS
// ----------------------------------------------------
familyRouter.post('/rewards', (req: AuthenticatedRequest, res: Response): void => {
  const { title, description, pointsRequired, icon } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'Reward title is required.' });
    return;
  }

  const pts = Number(pointsRequired);
  if (isNaN(pts) || pts <= 0) {
    res.status(400).json({ error: 'Points required must be greater than zero.' });
    return;
  }

  const currentDb = db.get();
  const newReward: Reward = {
    id: genId('reward'),
    title: title.trim(),
    description: description?.trim() || undefined,
    pointsRequired: Math.round(pts),
    icon: icon || '🎁',
    active: true,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  currentDb.rewards.push(newReward);
  db.save();
  db.logAudit('REWARD_CREATED', `Created reward "${newReward.title}" (${newReward.pointsRequired} pts)`);

  res.status(201).json({ message: `Reward created.`, reward: newReward });
});

familyRouter.put('/rewards/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { title, description, pointsRequired, icon, active, archived } = req.body;
  const currentDb = db.get();

  const reward = currentDb.rewards.find(r => r.id === id);
  if (!reward) {
    res.status(404).json({ error: 'Reward not found.' });
    return;
  }

  if (title && typeof title === 'string') reward.title = title.trim();
  if (description !== undefined) reward.description = description?.trim() || undefined;
  if (pointsRequired !== undefined) {
    const pts = Number(pointsRequired);
    if (!isNaN(pts) && pts > 0) reward.pointsRequired = Math.round(pts);
  }
  if (icon !== undefined) reward.icon = icon;
  if (active !== undefined) reward.active = Boolean(active);
  if (archived !== undefined) reward.archived = Boolean(archived);
  reward.updatedAt = new Date().toISOString();

  db.save();
  db.logAudit('REWARD_UPDATED', `Updated reward "${reward.title}"`);

  res.json({ message: 'Reward updated.', reward });
});

familyRouter.post('/rewards/:id/redeem', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { childId, notes } = req.body;

  if (!childId) {
    res.status(400).json({ error: 'Child selection is required.' });
    return;
  }

  const currentDb = db.get();
  const reward = currentDb.rewards.find(r => r.id === id);
  if (!reward || reward.archived) {
    res.status(404).json({ error: 'Reward not found or no longer available.' });
    return;
  }

  const child = currentDb.children.find(c => c.id === childId);
  if (!child) {
    res.status(404).json({ error: 'Child not found.' });
    return;
  }

  // Calculate current total net points balance for this child
  const totalBalance = currentDb.pointTransactions
    .filter(t => t.childId === child.id)
    .reduce((sum, t) => sum + t.points, 0);

  const deduct = currentDb.settings.rewardsDeductPoints;

  if (deduct && totalBalance < reward.pointsRequired) {
    res.status(400).json({
      error: `${child.name} has ${totalBalance} points, but this reward requires ${reward.pointsRequired} points.`,
    });
    return;
  }

  const redemptionId = genId('redemption');

  const redemption: RewardRedemption = {
    id: redemptionId,
    rewardId: reward.id,
    childId: child.id,
    pointsSpent: deduct ? reward.pointsRequired : 0,
    status: 'fulfilled', // Mom redeemed it directly in app
    notes: notes?.trim() || undefined,
    requestedAt: new Date().toISOString(),
    fulfilledAt: new Date().toISOString(),
  };

  currentDb.redemptions.push(redemption);

  // If configured to deduct points, record ledger transaction
  let tx: PointTransaction | null = null;
  if (deduct) {
    tx = {
      id: genId('tx'),
      childId: child.id,
      rewardId: reward.id,
      redemptionId: redemption.id,
      points: -reward.pointsRequired,
      type: 'reward_redemption',
      reason: `Redeemed reward: ${reward.title}`,
      timestamp: new Date().toISOString(),
    };
    currentDb.pointTransactions.push(tx);
  }

  db.save();
  db.logAudit(
    'REWARD_REDEEMED',
    `${child.name} redeemed reward "${reward.title}"${deduct ? ` (-${reward.pointsRequired} pts)` : ''}`,
    child.id
  );

  res.json({
    message: `🎉 Reward "${reward.title}" redeemed for ${child.name}!`,
    redemption,
    transaction: tx,
  });
});

// ----------------------------------------------------
// SETTINGS & BACKUP/RESTORE
// ----------------------------------------------------
familyRouter.put('/settings', (req: AuthenticatedRequest, res: Response): void => {
  const currentDb = db.get();
  const updates = req.body as Partial<FamilySettings>;

  if (updates.familyName !== undefined && typeof updates.familyName === 'string') {
    currentDb.settings.familyName = updates.familyName.trim();
  }
  if (updates.weekStartDay !== undefined && (updates.weekStartDay === 0 || updates.weekStartDay === 1)) {
    currentDb.settings.weekStartDay = updates.weekStartDay;
  }
  if (updates.timezone !== undefined && typeof updates.timezone === 'string') {
    currentDb.settings.timezone = updates.timezone.trim();
  }
  if (updates.defaultWeeklyGoal !== undefined) {
    const goal = Number(updates.defaultWeeklyGoal);
    if (!isNaN(goal) && goal > 0) currentDb.settings.defaultWeeklyGoal = goal;
  }
  if (updates.allowNegativePoints !== undefined) {
    currentDb.settings.allowNegativePoints = Boolean(updates.allowNegativePoints);
  }
  if (updates.defaultRequireApproval !== undefined) {
    currentDb.settings.defaultRequireApproval = Boolean(updates.defaultRequireApproval);
  }
  if (updates.leaderboardEnabled !== undefined) {
    currentDb.settings.leaderboardEnabled = Boolean(updates.leaderboardEnabled);
  }
  if (updates.rewardsEnabled !== undefined) {
    currentDb.settings.rewardsEnabled = Boolean(updates.rewardsEnabled);
  }
  if (updates.rewardsDeductPoints !== undefined) {
    currentDb.settings.rewardsDeductPoints = Boolean(updates.rewardsDeductPoints);
  }

  db.save();
  db.logAudit('SETTINGS_UPDATED', 'Family settings updated');

  res.json({ message: 'Settings saved.', settings: currentDb.settings });
});

// Data export
familyRouter.get('/backup/export', (_req: AuthenticatedRequest, res: Response) => {
  const currentDb = db.get();
  // Safe export omitting sensitive secrets
  const exportPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    familyName: currentDb.settings.familyName,
    settings: currentDb.settings,
    children: currentDb.children,
    tasks: currentDb.tasks,
    taskCompletions: currentDb.taskCompletions,
    pointTransactions: currentDb.pointTransactions,
    rewards: currentDb.rewards,
    redemptions: currentDb.redemptions,
    auditLogs: currentDb.auditLogs,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=family_points_backup_${Date.now()}.json`);
  res.json(exportPayload);
});

// Data import/restore
familyRouter.post('/backup/import', (req: AuthenticatedRequest, res: Response): void => {
  const { data } = req.body;
  if (!data || typeof data !== 'object') {
    res.status(400).json({ error: 'Valid backup JSON data is required.' });
    return;
  }

  const currentDb = db.get();

  if (Array.isArray(data.children)) currentDb.children = data.children;
  if (Array.isArray(data.tasks)) currentDb.tasks = data.tasks;
  if (Array.isArray(data.taskCompletions)) currentDb.taskCompletions = data.taskCompletions;
  if (Array.isArray(data.pointTransactions)) currentDb.pointTransactions = data.pointTransactions;
  if (Array.isArray(data.rewards)) currentDb.rewards = data.rewards;
  if (Array.isArray(data.redemptions)) currentDb.redemptions = data.redemptions;
  if (data.settings && typeof data.settings === 'object') {
    currentDb.settings = { ...currentDb.settings, ...data.settings };
  }

  db.save();
  db.logAudit('BACKUP_RESTORED', 'Family data restored from backup file');

  res.json({ message: 'Family data successfully restored from backup.' });
});

// Seed starter chores & rewards if Mom wants ready-to-use family templates
familyRouter.post('/seed-starter', (req: AuthenticatedRequest, res: Response): void => {
  const currentDb = db.get();

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

  // Append items that don't already exist by title
  for (const st of starterTasks) {
    if (!currentDb.tasks.some(t => t.title.toLowerCase() === st.title.toLowerCase())) {
      currentDb.tasks.push(st);
    }
  }

  for (const sr of starterRewards) {
    if (!currentDb.rewards.some(r => r.title.toLowerCase() === sr.title.toLowerCase())) {
      currentDb.rewards.push(sr);
    }
  }

  db.save();
  db.logAudit('STARTER_PACK_LOADED', 'Starter chore tasks and rewards loaded');

  res.json({ message: 'Starter tasks and rewards loaded successfully!' });
});
