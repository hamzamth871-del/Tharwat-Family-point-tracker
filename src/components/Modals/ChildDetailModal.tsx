import React, { useState } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { Child } from '../../types';
import { getWeekRange, isDateInWeek } from '../../lib/dateUtils';
import { X, Award, CheckCircle2, Clock, Calendar, Edit3, Archive, RotateCcw, Sparkles } from 'lucide-react';

interface ChildDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child | null;
  onEditChild: (child: Child) => void;
  onAwardPoints: (childId: string) => void;
}

export const ChildDetailModal: React.FC<ChildDetailModalProps> = ({
  isOpen,
  onClose,
  child,
  onEditChild,
  onAwardPoints,
}) => {
  const {
    settings,
    selectedWeek,
    pointTransactions,
    taskCompletions,
    tasks,
    rewards,
    redemptions,
    archiveChild,
    getChildWeeklyPoints,
    getChildTotalBalance,
    getChildLifetimeEarned,
    getChildDailyPoints,
    getChildCompletedTasks,
    getChildPendingTasksCount,
  } = useFamily();

  const [confirmArchive, setConfirmArchive] = useState(false);

  if (!isOpen || !child) return null;

  // Previous week calculation
  const prevDate = new Date(selectedWeek.startDate);
  prevDate.setDate(prevDate.getDate() - 7);
  const previousWeekRange = getWeekRange(prevDate, settings.weekStartDay);

  const weeklyPoints = getChildWeeklyPoints(child.id, selectedWeek);
  const previousWeeklyPoints = getChildWeeklyPoints(child.id, previousWeekRange);
  const totalBalance = getChildTotalBalance(child.id);
  const lifetimeEarned = getChildLifetimeEarned(child.id);
  const completedTasks = getChildCompletedTasks(child.id, selectedWeek);
  const pendingCount = getChildPendingTasksCount(child.id);

  const goal = child.weeklyGoal || settings.defaultWeeklyGoal || 50;
  const progressPercent = Math.min(100, Math.round((weeklyPoints / goal) * 100));

  const dailyBreakdown = getChildDailyPoints(child.id, selectedWeek);

  // Recent activity for this child
  const childTransactions = pointTransactions
    .filter(t => t.childId === child.id)
    .slice(0, 10);

  // Redemptions for this child
  const childRedemptions = redemptions.filter(r => r.childId === child.id);

  const handleToggleArchive = async () => {
    await archiveChild(child.id, !child.archived);
    setConfirmArchive(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151a17] border border-[#24332a] w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#24332a] mb-5">
          <div className="flex items-center gap-3.5">
            <div
              style={{ backgroundColor: `${child.color}20`, borderColor: child.color }}
              className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-md"
            >
              {child.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{child.name}</h2>
                {child.nickname && (
                  <span className="text-xs text-[#a6aea9] bg-[#101311] px-2 py-0.5 rounded-md border border-[#24332a]">
                    "{child.nickname}"
                  </span>
                )}
                {child.archived && (
                  <span className="text-[10px] bg-[#3d1818] text-[#ef4444] px-2 py-0.5 rounded font-semibold border border-[#ef4444]/30">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a6aea9] mt-0.5">
                {child.age ? `${child.age} years old • ` : ''}Weekly Goal: {goal} pts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEditChild(child)}
              className="p-2 rounded-xl bg-[#101311] border border-[#24332a] text-[#a6aea9] hover:text-white hover:border-[#33483b] transition-colors"
              title="Edit Child Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#101311] border border-[#24332a] text-[#a6aea9] hover:text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick action strip */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => onAwardPoints(child.id)}
            className="flex-1 bg-[#174d35] hover:bg-[#1e6143] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-[#43b879]/40 shadow-sm transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 text-[#43b879]" />
            <span>Award / Adjust Points</span>
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3">
            <div className="text-[11px] text-[#a6aea9]">This Week</div>
            <div className="text-xl font-black text-[#43b879] mt-0.5">{weeklyPoints} pts</div>
            <div className="text-[10px] text-[#a6aea9] mt-1">{progressPercent}% of goal</div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3">
            <div className="text-[11px] text-[#a6aea9]">Last Week</div>
            <div className="text-xl font-bold text-white mt-0.5">{previousWeeklyPoints} pts</div>
            <div className="text-[10px] text-[#a6aea9] mt-1">Previous 7 days</div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3">
            <div className="text-[11px] text-[#a6aea9]">Total Balance</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalBalance} pts</div>
            <div className="text-[10px] text-[#a6aea9] mt-1">Available to spend</div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3">
            <div className="text-[11px] text-[#a6aea9]">Lifetime Earned</div>
            <div className="text-xl font-bold text-[#43b879] mt-0.5">{lifetimeEarned} pts</div>
            <div className="text-[10px] text-[#a6aea9] mt-1">Gross achievements</div>
          </div>
        </div>

        {/* Weekly Goal Progress Bar */}
        <div className="bg-[#101311] border border-[#24332a] rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-white">Weekly Progress ({selectedWeek.displayRange})</span>
            <span className="text-[#43b879] font-bold">{weeklyPoints} / {goal} pts ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-[#1a231e] h-2.5 rounded-full overflow-hidden border border-[#24332a]">
            <div
              className="bg-gradient-to-r from-[#174d35] to-[#43b879] h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 7-Day Visual Daily Breakdown */}
        <div className="bg-[#101311] border border-[#24332a] rounded-xl p-4 mb-5">
          <div className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#43b879]" />
            <span>Daily Points Breakdown This Week</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {selectedWeek.days.map(d => {
              const dayPts = dailyBreakdown[d.dateString] || 0;
              return (
                <div
                  key={d.dateString}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between ${
                    d.isToday
                      ? 'bg-[#1a2e23] border-[#43b879]'
                      : 'bg-[#151a17] border-[#24332a]'
                  }`}
                >
                  <span className="text-[10px] font-medium text-[#a6aea9]">{d.dayName}</span>
                  <span className="text-xs font-bold my-1 text-white">{d.dayNumber}</span>
                  <span
                    className={`text-xs font-extrabold ${
                      dayPts > 0 ? 'text-[#43b879]' : 'text-[#a6aea9]'
                    }`}
                  >
                    {dayPts > 0 ? `+${dayPts}` : '0'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completed Tasks & Pending */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#43b879]" />
                <span>Completed Tasks ({completedTasks.length})</span>
              </span>
            </div>
            {completedTasks.length === 0 ? (
              <p className="text-xs text-[#a6aea9] italic py-2">No tasks completed yet this week.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {completedTasks.map(c => {
                  const t = tasks.find(tsk => tsk.id === c.taskId);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-xs bg-[#151a17] p-2 rounded-lg border border-[#24332a]"
                    >
                      <span className="truncate text-white">{t ? t.title : 'Task'}</span>
                      <span className="text-[#43b879] font-bold shrink-0 ml-2">+{c.pointsAwarded} pts</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>Pending Approvals ({pendingCount})</span>
              </span>
            </div>
            {pendingCount === 0 ? (
              <p className="text-xs text-[#a6aea9] italic py-2">All submissions reviewed.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {taskCompletions
                  .filter(c => c.childId === child.id && c.status === 'pending')
                  .map(c => {
                    const t = tasks.find(tsk => tsk.id === c.taskId);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-xs bg-[#151a17] p-2 rounded-lg border border-[#24332a]"
                      >
                        <span className="truncate text-[#fbbf24]">{t ? t.title : 'Task'}</span>
                        <span className="text-[#fbbf24] font-semibold shrink-0 ml-2">Awaiting review</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Ledger for this child */}
        <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5 mb-5">
          <div className="text-xs font-semibold text-white mb-2.5">Recent Activity Ledger</div>
          {childTransactions.length === 0 ? (
            <p className="text-xs text-[#a6aea9] italic py-2">No points recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {childTransactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#151a17] border border-[#24332a]"
                >
                  <div className="truncate mr-2">
                    <div className="text-white font-medium truncate">{tx.reason}</div>
                    <div className="text-[10px] text-[#a6aea9]">
                      {new Date(tx.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <span
                    className={`font-bold shrink-0 text-sm ${
                      tx.points > 0 ? 'text-[#43b879]' : 'text-[#ef4444]'
                    }`}
                  >
                    {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewards redeemed */}
        {childRedemptions.length > 0 && (
          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5 mb-5">
            <div className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Redemption History</span>
            </div>
            <div className="space-y-2">
              {childRedemptions.map(red => {
                const rew = rewards.find(r => r.id === red.rewardId);
                return (
                  <div
                    key={red.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#151a17] border border-[#24332a]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-lg">{rew ? rew.icon : '🎁'}</span>
                      <div className="truncate">
                        <div className="text-white font-medium truncate">{rew ? rew.title : 'Reward'}</div>
                        <div className="text-[10px] text-[#a6aea9]">
                          {new Date(red.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#43b879]">Fulfilled</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Archive confirmation / Danger zone */}
        <div className="pt-3 border-t border-[#24332a] flex items-center justify-between">
          {!confirmArchive ? (
            <button
              onClick={() => setConfirmArchive(true)}
              className="text-xs text-[#a6aea9] hover:text-[#ef4444] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{child.archived ? 'Restore Child to Active' : 'Archive Child'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#ef4444]">Archive child? (Historical points preserved)</span>
              <button
                onClick={handleToggleArchive}
                className="text-xs bg-[#7f1d1d] hover:bg-[#991b1b] text-white px-2.5 py-1 rounded-md font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmArchive(false)}
                className="text-xs bg-[#101311] text-[#a6aea9] px-2 py-1 rounded-md"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white px-4 py-2 rounded-xl border border-[#24332a] text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
