import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Child } from '../types';
import {
  Users,
  Plus,
  Award,
  Edit3,
  Archive,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Eye,
} from 'lucide-react';

interface ChildrenScreenProps {
  onOpenAddChild: () => void;
  onEditChild: (child: Child) => void;
  onSelectChild: (child: Child) => void;
  onOpenAwardPoints: (childId: string) => void;
}

export const ChildrenScreen: React.FC<ChildrenScreenProps> = ({
  onOpenAddChild,
  onEditChild,
  onSelectChild,
  onOpenAwardPoints,
}) => {
  const {
    children,
    settings,
    getChildWeeklyPoints,
    getChildTotalBalance,
    getChildLifetimeEarned,
    getChildCompletedTasks,
    getChildPendingTasksCount,
    archiveChild,
  } = useFamily();

  const [showArchived, setShowArchived] = useState(false);

  const displayedChildren = children.filter(c => (showArchived ? true : !c.archived));
  const activeCount = children.filter(c => !c.archived).length;
  const archivedCount = children.filter(c => c.archived).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#43b879]" />
            <span>Family Children</span>
          </h1>
          <p className="text-xs text-[#a6aea9]">
            Manage child profiles, goals, and responsibility records
          </p>
        </div>

        <div className="flex items-center gap-2">
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                showArchived
                  ? 'bg-[#174d35] text-white border-[#43b879]/40'
                  : 'bg-[#151a17] text-[#a6aea9] border-[#24332a] hover:text-white'
              }`}
            >
              {showArchived ? 'Hide Archived' : `Archived (${archivedCount})`}
            </button>
          )}

          <button
            onClick={onOpenAddChild}
            className="px-4 py-2 bg-[#174d35] hover:bg-[#1e6143] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#43b879]/40 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#43b879]" />
            <span>Add Child</span>
          </button>
        </div>
      </div>

      {displayedChildren.length === 0 ? (
        <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#174d35]/30 text-[#43b879] flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No children found</h3>
          <p className="text-xs text-[#a6aea9] mb-4">
            Add children to begin managing responsibilities and tracking weekly points.
          </p>
          <button
            onClick={onOpenAddChild}
            className="px-4 py-2 bg-[#174d35] hover:bg-[#1e6143] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#43b879]" />
            <span>Add Child</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedChildren.map(child => {
            const weeklyPts = getChildWeeklyPoints(child.id);
            const totalBalance = getChildTotalBalance(child.id);
            const lifetime = getChildLifetimeEarned(child.id);
            const completed = getChildCompletedTasks(child.id).length;
            const pending = getChildPendingTasksCount(child.id);
            const goal = child.weeklyGoal || settings.defaultWeeklyGoal || 50;
            const pct = Math.min(100, Math.round((weeklyPts / goal) * 100));

            return (
              <div
                key={child.id}
                className={`bg-[#151a17] border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                  child.archived
                    ? 'border-[#3d1818] opacity-75'
                    : 'border-[#24332a] hover:border-[#33483b]'
                }`}
              >
                <div>
                  {/* Child Header */}
                  <div className="flex items-start justify-between mb-4">
                    <button
                      onClick={() => onSelectChild(child)}
                      className="flex items-center gap-3.5 text-left cursor-pointer group"
                    >
                      <div
                        style={{ backgroundColor: `${child.color}25` }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border border-[#24332a] group-hover:scale-105 transition-transform"
                      >
                        {child.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white group-hover:text-[#43b879] transition-colors">
                            {child.name}
                          </h3>
                          {child.nickname && (
                            <span className="text-[11px] text-[#a6aea9] bg-[#101311] px-2 py-0.5 rounded border border-[#24332a]">
                              {child.nickname}
                            </span>
                          )}
                          {child.archived && (
                            <span className="text-[10px] bg-[#3d1818] text-[#ef4444] px-1.5 py-0.5 rounded font-bold">
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a6aea9] mt-0.5">
                          {child.age ? `${child.age} yrs • ` : ''}Weekly Goal: {goal} pts
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditChild(child)}
                        className="p-2 rounded-xl bg-[#101311] hover:bg-[#1f2923] text-[#a6aea9] hover:text-white border border-[#24332a] transition-colors"
                        title="Edit profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 bg-[#101311] border border-[#24332a] rounded-xl p-3 mb-4 text-center">
                    <div>
                      <div className="text-[10px] text-[#a6aea9] uppercase font-semibold">Weekly</div>
                      <div className="text-base font-black text-[#43b879] mt-0.5">{weeklyPts} pts</div>
                    </div>
                    <div className="border-x border-[#24332a]">
                      <div className="text-[10px] text-[#a6aea9] uppercase font-semibold">Balance</div>
                      <div className="text-base font-bold text-white mt-0.5">{totalBalance} pts</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#a6aea9] uppercase font-semibold">Lifetime</div>
                      <div className="text-base font-bold text-white mt-0.5">{lifetime} pts</div>
                    </div>
                  </div>

                  {/* Goal Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-[#a6aea9] flex items-center gap-1 font-medium">
                        <TrendingUp className="w-3.5 h-3.5 text-[#43b879]" />
                        <span>Weekly Goal Progress</span>
                      </span>
                      <span className="text-white font-bold">{pct}%</span>
                    </div>
                    <div className="w-full bg-[#101311] h-2 rounded-full overflow-hidden border border-[#24332a]">
                      <div
                        className="bg-gradient-to-r from-[#174d35] to-[#43b879] h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Task counts */}
                  <div className="flex items-center justify-between text-xs text-[#a6aea9] mb-4">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#43b879]" />
                      <span>{completed} tasks completed this week</span>
                    </span>
                    {pending > 0 && (
                      <span className="text-[#fbbf24] font-semibold">{pending} pending approval</span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-[#24332a]">
                  <button
                    onClick={() => onOpenAwardPoints(child.id)}
                    className="flex-1 bg-[#174d35] hover:bg-[#1e6143] text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#43b879]/40 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5 text-[#43b879]" />
                    <span>Award Points</span>
                  </button>

                  <button
                    onClick={() => onSelectChild(child)}
                    className="flex-1 bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white py-2 px-3 rounded-xl text-xs font-semibold border border-[#24332a] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>

                  {child.archived && (
                    <button
                      onClick={() => archiveChild(child.id, false)}
                      className="p-2 rounded-xl bg-[#101311] text-[#43b879] border border-[#24332a] hover:bg-[#1a231e]"
                      title="Restore child"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
