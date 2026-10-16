import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AdminProfile,
  FamilySettings,
  Child,
  Task,
  TaskCompletion,
  PointTransaction,
  Reward,
  RewardRedemption,
  AuditLog,
} from '../types';
import { api, getStoredToken } from '../lib/api';
import { getWeekRange, WeekRange, isDateInWeek } from '../lib/dateUtils';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface LeaderboardEntry {
  child: Child;
  rank: number;
  weeklyPoints: number;
  completedTasks: number;
  weeklyGoal: number;
  goalPercentage: number;
}

interface FamilyContextType {
  // Auth
  loading: boolean;
  isSetup: boolean;
  isAuthenticated: boolean;
  admin: AdminProfile | null;
  login: (email: string, pass: string) => Promise<void>;
  setupOwner: (email: string, pass: string, name?: string, familyName?: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (cur: string, next: string) => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;

  // Data
  settings: FamilySettings;
  children: Child[];
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  pointTransactions: PointTransaction[];
  rewards: Reward[];
  redemptions: RewardRedemption[];
  auditLogs: AuditLog[];
  refreshData: () => Promise<void>;

  // Week navigation
  selectedWeek: WeekRange;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  setWeekDate: (d: Date) => void;

  // Selected child filter / detail
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Calculations
  getChildWeeklyPoints: (childId: string, week?: WeekRange) => number;
  getChildTotalBalance: (childId: string) => number;
  getChildLifetimeEarned: (childId: string) => number;
  getChildDailyPoints: (childId: string, week?: WeekRange) => Record<string, number>;
  getChildCompletedTasks: (childId: string, week?: WeekRange) => TaskCompletion[];
  getChildPendingTasksCount: (childId: string) => number;
  totalFamilyWeeklyPoints: number;
  totalFamilyCompletedTasksCount: number;
  pendingApprovals: (TaskCompletion & { task?: Task; child?: Child })[];
  leaderboard: LeaderboardEntry[];

  // Mutators
  addChild: (data: Partial<Child>) => Promise<void>;
  updateChild: (id: string, data: Partial<Child>) => Promise<void>;
  archiveChild: (id: string, archive?: boolean) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  archiveTask: (id: string, archive?: boolean) => Promise<void>;
  completeTask: (taskId: string, childId: string, date?: string, notes?: string) => Promise<void>;
  approveCompletion: (completionId: string) => Promise<void>;
  rejectCompletion: (completionId: string, reason?: string) => Promise<void>;
  awardPoints: (childId: string, points: number, reason: string, taskId?: string) => Promise<void>;
  adjustPoints: (childId: string, points: number, reason: string) => Promise<void>;
  reverseTransaction: (txId: string, reason?: string) => Promise<void>;
  createReward: (data: Partial<Reward>) => Promise<void>;
  updateReward: (id: string, data: Partial<Reward>) => Promise<void>;
  archiveReward: (id: string, archive?: boolean) => Promise<void>;
  redeemReward: (rewardId: string, childId: string, notes?: string) => Promise<void>;
  updateSettings: (newSettings: Partial<FamilySettings>) => Promise<void>;
  seedStarterPack: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | null>(null);

const DEFAULT_SETTINGS: FamilySettings = {
  familyName: 'Our Family',
  weekStartDay: 1,
  timezone: 'UTC',
  defaultWeeklyGoal: 50,
  allowNegativePoints: true,
  defaultRequireApproval: true,
  leaderboardEnabled: true,
  rewardsEnabled: true,
  rewardsDeductPoints: true,
};

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  const [settings, setSettings] = useState<FamilySettings>(DEFAULT_SETTINGS);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Compute selected week range
  const selectedWeek = useMemo(() => {
    return getWeekRange(referenceDate, settings.weekStartDay);
  }, [referenceDate, settings.weekStartDay]);

  const goToPreviousWeek = useCallback(() => {
    setReferenceDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setReferenceDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setReferenceDate(new Date());
  }, []);

  const setWeekDate = useCallback((d: Date) => {
    setReferenceDate(new Date(d));
  }, []);

  // Fetch full family state from backend
  const refreshData = useCallback(async () => {
    try {
      const state = await api.getFamilyState();
      setSettings(state.settings);
      setChildrenList(state.children || []);
      setTasks(state.tasks || []);
      setTaskCompletions(state.taskCompletions || []);
      setPointTransactions(state.pointTransactions || []);
      setRewards(state.rewards || []);
      setRedemptions(state.redemptions || []);
      setAuditLogs(state.auditLogs || []);
    } catch (err: any) {
      if (err.message && err.message.includes('Authentication')) {
        setIsAuthenticated(false);
        setAdmin(null);
      } else {
        console.error('Failed to load family data:', err);
      }
    }
  }, []);

  // Check initial app and auth status
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const status = await api.getStatus();
        setIsSetup(status.isSetup);

        const token = getStoredToken();
        if (token && status.isSetup) {
          try {
            const me = await api.getMe();
            setAdmin(me.admin);
            setSettings(me.settings);
            setIsAuthenticated(true);
            await refreshData();
          } catch {
            setIsAuthenticated(false);
            setAdmin(null);
          }
        } else {
          setIsAuthenticated(false);
          setAdmin(null);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setAdmin(null);
      showToast('Session expired. Please log in again.', 'info');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshData, showToast]);

  // Auth actions
  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setAdmin(res.admin);
    setSettings(res.settings);
    setIsAuthenticated(true);
    await refreshData();
    showToast(`Welcome back, ${res.admin.displayName}!`);
  };

  const setupOwner = async (email: string, pass: string, name?: string, familyName?: string) => {
    const res = await api.setupOwner({ email, password: pass, displayName: name, familyName });
    setAdmin(res.admin);
    setSettings(res.settings);
    setIsSetup(true);
    setIsAuthenticated(true);
    await refreshData();
    showToast('Administrator setup complete! Welcome to Family Points.');
  };

  const logout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setAdmin(null);
    showToast('Logged out securely.', 'info');
  };

  const changePassword = async (cur: string, next: string) => {
    const res = await api.changePassword(cur, next);
    showToast(res.message);
  };

  const updateProfile = async (name: string, email: string) => {
    const res = await api.updateProfile(name, email);
    setAdmin(res.admin);
    showToast(res.message);
  };

  // Calculations
  const getChildWeeklyPoints = useCallback(
    (childId: string, week: WeekRange = selectedWeek): number => {
      return pointTransactions
        .filter(t => t.childId === childId && isDateInWeek(t.timestamp, week))
        .reduce((sum, t) => sum + t.points, 0);
    },
    [pointTransactions, selectedWeek]
  );

  const getChildTotalBalance = useCallback(
    (childId: string): number => {
      return pointTransactions
        .filter(t => t.childId === childId)
        .reduce((sum, t) => sum + t.points, 0);
    },
    [pointTransactions]
  );

  const getChildLifetimeEarned = useCallback(
    (childId: string): number => {
      return pointTransactions
        .filter(t => t.childId === childId && t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);
    },
    [pointTransactions]
  );

  const getChildDailyPoints = useCallback(
    (childId: string, week: WeekRange = selectedWeek): Record<string, number> => {
      const daily: Record<string, number> = {};
      week.days.forEach(d => {
        daily[d.dateString] = 0;
      });

      pointTransactions
        .filter(t => t.childId === childId && isDateInWeek(t.timestamp, week))
        .forEach(t => {
          const txDate = t.timestamp.split('T')[0];
          if (daily[txDate] !== undefined) {
            daily[txDate] += t.points;
          }
        });

      return daily;
    },
    [pointTransactions, selectedWeek]
  );

  const getChildCompletedTasks = useCallback(
    (childId: string, week: WeekRange = selectedWeek): TaskCompletion[] => {
      return taskCompletions.filter(
        c => c.childId === childId && c.status === 'approved' && isDateInWeek(c.submittedAt, week)
      );
    },
    [taskCompletions, selectedWeek]
  );

  const getChildPendingTasksCount = useCallback(
    (childId: string): number => {
      return taskCompletions.filter(c => c.childId === childId && c.status === 'pending').length;
    },
    [taskCompletions]
  );

  const totalFamilyWeeklyPoints = useMemo(() => {
    return pointTransactions
      .filter(t => isDateInWeek(t.timestamp, selectedWeek))
      .reduce((sum, t) => sum + t.points, 0);
  }, [pointTransactions, selectedWeek]);

  const totalFamilyCompletedTasksCount = useMemo(() => {
    return taskCompletions.filter(
      c => c.status === 'approved' && isDateInWeek(c.submittedAt, selectedWeek)
    ).length;
  }, [taskCompletions, selectedWeek]);

  const pendingApprovals = useMemo(() => {
    return taskCompletions
      .filter(c => c.status === 'pending')
      .map(c => ({
        ...c,
        task: tasks.find(t => t.id === c.taskId),
        child: childrenList.find(ch => ch.id === c.childId),
      }));
  }, [taskCompletions, tasks, childrenList]);

  const leaderboard = useMemo(() => {
    const activeChildren = childrenList.filter(c => !c.archived);
    const scored = activeChildren.map(child => {
      const weeklyPoints = getChildWeeklyPoints(child.id, selectedWeek);
      const completed = getChildCompletedTasks(child.id, selectedWeek).length;
      const goal = child.weeklyGoal || settings.defaultWeeklyGoal || 50;
      const goalPercentage = Math.min(100, Math.round((weeklyPoints / goal) * 100));
      return {
        child,
        weeklyPoints,
        completedTasks: completed,
        weeklyGoal: goal,
        goalPercentage,
      };
    });

    // Sort descending by points, tie-breaking by completed tasks
    scored.sort((a, b) => b.weeklyPoints - a.weeklyPoints || b.completedTasks - a.completedTasks);

    // Calculate ranks with tie handling
    let currentRank = 1;
    const ranked: LeaderboardEntry[] = [];
    for (let i = 0; i < scored.length; i++) {
      if (i > 0 && scored[i].weeklyPoints < scored[i - 1].weeklyPoints) {
        currentRank = i + 1;
      }
      ranked.push({
        ...scored[i],
        rank: currentRank,
      });
    }

    return ranked;
  }, [childrenList, getChildWeeklyPoints, getChildCompletedTasks, selectedWeek, settings.defaultWeeklyGoal]);

  // Mutator actions
  const addChild = async (data: Partial<Child>) => {
    const res = await api.addChild(data);
    showToast(res.message);
    await refreshData();
  };

  const updateChild = async (id: string, data: Partial<Child>) => {
    const res = await api.updateChild(id, data);
    showToast(res.message);
    await refreshData();
  };

  const archiveChild = async (id: string, archive?: boolean) => {
    const res = await api.archiveChild(id, archive);
    showToast(res.message);
    await refreshData();
  };

  const createTask = async (data: Partial<Task>) => {
    const res = await api.createTask(data);
    showToast(res.message);
    await refreshData();
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    const res = await api.updateTask(id, data);
    showToast(res.message);
    await refreshData();
  };

  const duplicateTask = async (id: string) => {
    const res = await api.duplicateTask(id);
    showToast(res.message);
    await refreshData();
  };

  const archiveTask = async (id: string, archive?: boolean) => {
    const res = await api.archiveTask(id, archive);
    showToast(res.message);
    await refreshData();
  };

  const completeTask = async (taskId: string, childId: string, date?: string, notes?: string) => {
    const res = await api.completeTask(taskId, childId, date, notes);
    showToast(res.message);
    await refreshData();
  };

  const approveCompletion = async (completionId: string) => {
    const res = await api.approveCompletion(completionId);
    showToast(res.message);
    await refreshData();
  };

  const rejectCompletion = async (completionId: string, reason?: string) => {
    const res = await api.rejectCompletion(completionId, reason);
    showToast(res.message, 'info');
    await refreshData();
  };

  const awardPoints = async (childId: string, points: number, reason: string, taskId?: string) => {
    const res = await api.awardPoints({ childId, points, reason, taskId });
    showToast(res.message);
    await refreshData();
  };

  const adjustPoints = async (childId: string, points: number, reason: string) => {
    const res = await api.adjustPoints({ childId, points, reason });
    showToast(res.message);
    await refreshData();
  };

  const reverseTransaction = async (txId: string, reason?: string) => {
    const res = await api.reverseTransaction(txId, reason);
    showToast(res.message);
    await refreshData();
  };

  const createReward = async (data: Partial<Reward>) => {
    const res = await api.createReward(data);
    showToast(res.message);
    await refreshData();
  };

  const updateReward = async (id: string, data: Partial<Reward>) => {
    const res = await api.updateReward(id, data);
    showToast(res.message);
    await refreshData();
  };

  const archiveReward = async (id: string, archive?: boolean) => {
    const res = await api.archiveReward(id, archive);
    showToast(res.message);
    await refreshData();
  };

  const redeemReward = async (rewardId: string, childId: string, notes?: string) => {
    const res = await api.redeemReward(rewardId, childId, notes);
    showToast(res.message);
    await refreshData();
  };

  const updateSettings = async (newSettings: Partial<FamilySettings>) => {
    const res = await api.updateSettings(newSettings);
    setSettings(res.settings);
    showToast(res.message);
    await refreshData();
  };

  const seedStarterPack = async () => {
    const res = await api.seedStarterPack();
    showToast(res.message);
    await refreshData();
  };

  return (
    <FamilyContext.Provider
      value={{
        loading,
        isSetup,
        isAuthenticated,
        admin,
        login,
        setupOwner,
        logout,
        changePassword,
        updateProfile,
        settings,
        children: childrenList,
        tasks,
        taskCompletions,
        pointTransactions,
        rewards,
        redemptions,
        auditLogs,
        refreshData,
        selectedWeek,
        goToPreviousWeek,
        goToNextWeek,
        goToCurrentWeek,
        setWeekDate,
        selectedChildId,
        setSelectedChildId,
        toasts,
        showToast,
        dismissToast,
        getChildWeeklyPoints,
        getChildTotalBalance,
        getChildLifetimeEarned,
        getChildDailyPoints,
        getChildCompletedTasks,
        getChildPendingTasksCount,
        totalFamilyWeeklyPoints,
        totalFamilyCompletedTasksCount,
        pendingApprovals,
        leaderboard,
        addChild,
        updateChild,
        archiveChild,
        createTask,
        updateTask,
        duplicateTask,
        archiveTask,
        completeTask,
        approveCompletion,
        rejectCompletion,
        awardPoints,
        adjustPoints,
        reverseTransaction,
        createReward,
        updateReward,
        archiveReward,
        redeemReward,
        updateSettings,
        seedStarterPack,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
