import React from 'react';
import { useFamily } from '../context/FamilyContext';
import {
  Users,
  CheckCircle2,
  Clock,
  Award,
  Plus,
  Trophy,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Child } from '../types';

interface HomeScreenProps {
  onOpenAddChild: () => void;
  onOpenCreateTask: () => void;
  onOpenAwardPoints: (childId?: string) => void;
  onOpenLeaderboard: () => void;
  onSelectChild: (child: Child) => void;
  onSelectTab: (tab: string) => void;
  onQuickCompleteTask: (defaultChildId?: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAddChild,
  onOpenCreateTask,
  onOpenAwardPoints,
  onOpenLeaderboard,
  onSelectChild,
  onSelectTab,
}) => {
  const {
    children,
    selectedWeek,
    settings,
    totalFamilyWeeklyPoints,
    totalFamilyCompletedTasksCount,
    pendingApprovals,
    getChildWeeklyPoints,
    getChildCompletedTasks,
    getChildPendingTasksCount,
    getChildTotalBalance,
  } = useFamily();

  const activeChildren = children.filter(c => !c.archived);

  // Compute total family goal
  const combinedGoal = activeChildren.reduce(
    (sum, c) => sum + (c.weeklyGoal || settings.defaultWeeklyGoal || 50),
    0
  );
  const familyProgressPercent =
    combinedGoal > 0 ? Math.min(100, Math.round((totalFamilyWeeklyPoints / combinedGoal) * 100)) : 0;

  // Empty state when family is new
  if (activeChildren.length === 0) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#174d35]/40 border border-[#43b879]/30 flex items-center justify-center text-[#43b879] shadow-xl shadow-[#174d35]/20 mb-6">
          <Users className="w-10 h-10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          Welcome to Family Points!
        </h2>
        <p className="text-sm text-[#a6aea9] max-w-md mb-8 leading-relaxed">
          Start by adding your children. Once added, you can customize chores, track weekly responsibility points, and celebrate family achievements together.
        </p>

        <button
          onClick={onOpenAddChild}
          className="bg-[#174d35] hover:bg-[#1e6143] text-white font-semibold py-3.5 px-6 rounded-2xl border border-[#43b879]/40 flex items-center gap-2.5 shadow-lg shadow-[#174d35]/30 text-sm transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 text-[#43b879]" />
          <span>Add Your First Child</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Pending Approvals Banner (if any) */}
      {pendingApprovals.length > 0 && (
        <div className="bg-gradient-to-r from-[#2a2212] to-[#1e190e] border border-[#fbbf24]/30 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {pendingApprovals.length} Task{pendingApprovals.length > 1 ? 's' : ''} Awaiting Mom's Approval
              </div>
              <div className="text-xs text-[#d1b87a]">
                Tap to review submitted evidence and award points
              </div>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('tasks')}
            className="px-3.5 py-1.5 rounded-xl bg-[#fbbf24] hover:bg-[#eab308] text-black text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Family Summary Stats Bar */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-semibold text-[#43b879] uppercase tracking-wider">
              Weekly Family Overview
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {selectedWeek.displayRange}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {settings.leaderboardEnabled && (
              <button
                onClick={onOpenLeaderboard}
                className="px-3 py-1.5 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white border border-[#24332a] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>Leaderboard</span>
              </button>
            )}
            <button
              onClick={() => onOpenAwardPoints()}
              className="px-3 py-1.5 rounded-xl bg-[#174d35] hover:bg-[#1e6143] text-white border border-[#43b879]/40 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-[#43b879]" />
              <span>+ Award Points</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5">
            <div className="text-[11px] text-[#a6aea9] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#43b879]" />
              <span>Total Points Earned</span>
            </div>
            <div className="text-2xl font-black text-[#43b879] mt-1">
              {totalFamilyWeeklyPoints}
            </div>
            <div className="text-[10px] text-[#a6aea9] mt-0.5">Across all children</div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5">
            <div className="text-[11px] text-[#a6aea9] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#43b879]" />
              <span>Completed Tasks</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalFamilyCompletedTasksCount}
            </div>
            <div className="text-[10px] text-[#a6aea9] mt-0.5">Approved this week</div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5">
            <div className="text-[11px] text-[#a6aea9] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Pending Reviews</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {pendingApprovals.length}
            </div>
            <div className="text-[10px] text-[#a6aea9] mt-0.5">Awaiting Mom</div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5">
            <div className="text-[11px] text-[#a6aea9] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Active Children</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {activeChildren.length}
            </div>
            <div className="text-[10px] text-[#a6aea9] mt-0.5">In family list</div>
          </div>
        </div>

        {/* Family Combined Progress */}
        <div className="mt-4 pt-3 border-t border-[#24332a]">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#43b879]" />
              <span>Family Weekly Goal Progress</span>
            </span>
            <span className="text-[#43b879] font-bold">
              {totalFamilyWeeklyPoints} / {combinedGoal} pts ({familyProgressPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#101311] h-2.5 rounded-full overflow-hidden border border-[#24332a]">
            <div
              className="bg-gradient-to-r from-[#174d35] to-[#43b879] h-full rounded-full transition-all duration-500"
              style={{ width: `${familyProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={onOpenAddChild}
          className="bg-[#151a17] hover:bg-[#1a231e] border border-[#24332a] p-3 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-[#101311] text-[#43b879] border border-[#24332a]">
            <Plus className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white">+ Add Child</div>
            <div className="text-[10px] text-[#a6aea9]">New profile</div>
          </div>
        </button>

        <button
          onClick={onOpenCreateTask}
          className="bg-[#151a17] hover:bg-[#1a231e] border border-[#24332a] p-3 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-[#101311] text-[#43b879] border border-[#24332a]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white">+ Create Task</div>
            <div className="text-[10px] text-[#a6aea9]">Assign chore</div>
          </div>
        </button>

        <button
          onClick={() => onOpenAwardPoints()}
          className="bg-[#151a17] hover:bg-[#1a231e] border border-[#24332a] p-3 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-[#174d35] text-[#43b879] border border-[#43b879]/30">
            <Award className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white">Award Points</div>
            <div className="text-[10px] text-[#a6aea9]">Bonus / Chore</div>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('weekly')}
          className="bg-[#151a17] hover:bg-[#1a231e] border border-[#24332a] p-3 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-[#101311] text-[#38bdf8] border border-[#24332a]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white">7-Day Ledger</div>
            <div className="text-[10px] text-[#a6aea9]">Daily points</div>
          </div>
        </button>
      </div>

      {/* Children Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Children Status</span>
            <span className="text-xs font-normal text-[#a6aea9]">({activeChildren.length})</span>
          </h2>
          <button
            onClick={() => onSelectTab('children')}
            className="text-xs text-[#43b879] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Manage All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeChildren.map(child => {
            const weeklyPts = getChildWeeklyPoints(child.id);
            const totalBal = getChildTotalBalance(child.id);
            const completed = getChildCompletedTasks(child.id).length;
            const pending = getChildPendingTasksCount(child.id);
            const childGoal = child.weeklyGoal || settings.defaultWeeklyGoal || 50;
            const pct = Math.min(100, Math.round((weeklyPts / childGoal) * 100));

            return (
              <div
                key={child.id}
                className="bg-[#151a17] border border-[#24332a] rounded-2xl p-4 shadow-sm hover:border-[#33483b] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => onSelectChild(child)}
                      className="flex items-center gap-3 text-left cursor-pointer group"
                    >
                      <div
                        style={{ backgroundColor: `${child.color}25` }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-[#24332a] shadow-sm group-hover:scale-105 transition-transform"
                      >
                        {child.avatar}
                      </div>
                      <div>
                        <div className="text-base font-bold text-white group-hover:text-[#43b879] transition-colors">
                          {child.name}
                        </div>
                        <div className="text-[11px] text-[#a6aea9]">
                          {child.age ? `${child.age} yrs • ` : ''}Balance: {totalBal} pts
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => onOpenAwardPoints(child.id)}
                      className="p-2 rounded-xl bg-[#174d35]/60 hover:bg-[#174d35] text-[#43b879] border border-[#43b879]/30 transition-colors"
                      title={`Award points to ${child.name}`}
                    >
                      <Award className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekly Points & Goal */}
                  <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3 mb-3">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-xs text-[#a6aea9]">This Week:</span>
                      <span className="text-lg font-black text-[#43b879]">
                        {weeklyPts}{' '}
                        <span className="text-xs font-medium text-[#a6aea9]">/ {childGoal} pts</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#151a17] h-2 rounded-full overflow-hidden border border-[#24332a]">
                      <div
                        className="bg-[#43b879] h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Task stats pills */}
                  <div className="flex items-center justify-between text-xs text-[#a6aea9] px-1 mb-3">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#43b879]" />
                      <span>{completed} completed</span>
                    </span>
                    {pending > 0 && (
                      <span className="flex items-center gap-1 text-[#fbbf24] font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pending} pending</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => onSelectChild(child)}
                  className="w-full mt-1 py-2 bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white rounded-xl text-xs font-semibold border border-[#24332a] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View Details & History</span>
                  <ArrowRight className="w-3 h-3 text-[#43b879]" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
