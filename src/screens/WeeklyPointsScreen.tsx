import React from 'react';
import { useFamily } from '../context/FamilyContext';
import { getWeekRange } from '../lib/dateUtils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface WeeklyPointsScreenProps {
  onOpenAwardPoints: (childId?: string) => void;
  onSelectTab: (tab: string) => void;
}

export const WeeklyPointsScreen: React.FC<WeeklyPointsScreenProps> = ({
  onOpenAwardPoints,
}) => {
  const {
    children,
    settings,
    selectedWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    totalFamilyWeeklyPoints,
    totalFamilyCompletedTasksCount,
    getChildWeeklyPoints,
    getChildDailyPoints,
    getChildCompletedTasks,
    getChildPendingTasksCount,
  } = useFamily();

  const activeChildren = children.filter(c => !c.archived);

  // Compute previous week for comparison
  const prevDate = new Date(selectedWeek.startDate);
  prevDate.setDate(prevDate.getDate() - 7);
  const previousWeekRange = getWeekRange(prevDate, settings.weekStartDay);

  const prevTotalFamilyPoints = activeChildren.reduce(
    (sum, c) => sum + getChildWeeklyPoints(c.id, previousWeekRange),
    0
  );
  const diffFromPrevWeek = totalFamilyWeeklyPoints - prevTotalFamilyPoints;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Banner & Week Selector */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#43b879]" />
              <h1 className="text-xl font-bold text-white">Seven-Day Weekly Points</h1>
            </div>
            <p className="text-xs text-[#a6aea9] mt-0.5">
              Ledger calculations start fresh every week while preserving full history
            </p>
          </div>

          {/* Week Navigation controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white border border-[#24332a] transition-colors"
              title="Previous Week"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={goToCurrentWeek}
              className="px-3 py-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-white border border-[#24332a] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>{selectedWeek.displayRange}</span>
              {selectedWeek.isCurrentWeek && (
                <span className="text-[10px] bg-[#174d35] text-[#43b879] px-1.5 py-0.2 rounded font-bold">
                  Current
                </span>
              )}
            </button>

            <button
              onClick={goToNextWeek}
              className="p-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white border border-[#24332a] transition-colors"
              title="Next Week"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Family Week Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#24332a]">
          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3">
            <div className="text-[11px] text-[#a6aea9]">Weekly Family Total</div>
            <div className="text-2xl font-black text-[#43b879] mt-0.5">
              {totalFamilyWeeklyPoints} pts
            </div>
            <div className="text-[10px] text-[#a6aea9] mt-1 flex items-center gap-1">
              {diffFromPrevWeek >= 0 ? (
                <span className="text-[#43b879] flex items-center font-bold">
                  <ArrowUpRight className="w-3 h-3" />+{diffFromPrevWeek}
                </span>
              ) : (
                <span className="text-[#ef4444] flex items-center font-bold">
                  <ArrowDownRight className="w-3 h-3" />{diffFromPrevWeek}
                </span>
              )}
              <span>vs previous week</span>
            </div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3">
            <div className="text-[11px] text-[#a6aea9]">Tasks Completed</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {totalFamilyCompletedTasksCount}
            </div>
            <div className="text-[10px] text-[#a6aea9] mt-1">This 7-day period</div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3">
            <div className="text-[11px] text-[#a6aea9]">Previous Week Total</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {prevTotalFamilyPoints} pts
            </div>
            <div className="text-[10px] text-[#a6aea9] mt-1">Historical score</div>
          </div>

          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-[#a6aea9]">Week Starts On</div>
              <div className="text-base font-bold text-white mt-0.5">
                {settings.weekStartDay === 1 ? 'Monday' : 'Sunday'}
              </div>
            </div>
            <div className="text-[10px] text-[#43b879]">Configured in Settings</div>
          </div>
        </div>
      </div>

      {/* Children 7-Day Performance Cards */}
      <div className="space-y-4">
        {activeChildren.map(child => {
          const weeklyPts = getChildWeeklyPoints(child.id, selectedWeek);
          const prevWeeklyPts = getChildWeeklyPoints(child.id, previousWeekRange);
          const completedTasks = getChildCompletedTasks(child.id, selectedWeek);
          const pendingCount = getChildPendingTasksCount(child.id);
          const dailyBreakdown = getChildDailyPoints(child.id, selectedWeek);

          const goal = child.weeklyGoal || settings.defaultWeeklyGoal || 50;
          const pct = Math.min(100, Math.round((weeklyPts / goal) * 100));
          const diff = weeklyPts - prevWeeklyPts;

          return (
            <div
              key={child.id}
              className="bg-[#151a17] border border-[#24332a] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4"
            >
              {/* Header with Avatar, Name, and Weekly Total */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24332a]">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: `${child.color}25` }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-[#24332a]"
                  >
                    {child.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{child.name}</h2>
                      {child.nickname && (
                        <span className="text-[10px] text-[#a6aea9] bg-[#101311] px-1.5 py-0.2 rounded border border-[#24332a]">
                          {child.nickname}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#a6aea9] flex items-center gap-2 mt-0.5">
                      <span>{completedTasks.length} tasks done</span>
                      <span>&bull;</span>
                      <span>Goal: {goal} pts</span>
                      {pendingCount > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-[#fbbf24] font-semibold">
                            {pendingCount} pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-black text-[#43b879]">
                      {weeklyPts} <span className="text-xs font-semibold text-[#a6aea9]">pts</span>
                    </div>
                    <div className="text-[10px] text-[#a6aea9] flex items-center gap-1 sm:justify-end">
                      {diff >= 0 ? (
                        <span className="text-[#43b879] flex items-center font-bold">
                          <ArrowUpRight className="w-3 h-3" />+{diff}
                        </span>
                      ) : (
                        <span className="text-[#ef4444] flex items-center font-bold">
                          <ArrowDownRight className="w-3 h-3" />{diff}
                        </span>
                      )}
                      <span>vs last wk ({prevWeeklyPts} pts)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenAwardPoints(child.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#174d35] hover:bg-[#1e6143] text-white border border-[#43b879]/40 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-[#43b879]" />
                    <span>Award</span>
                  </button>
                </div>
              </div>

              {/* Goal Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-[#a6aea9] font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#43b879]" />
                    <span>Progress to Weekly Target</span>
                  </span>
                  <span className="text-white font-bold">{pct}% of goal</span>
                </div>
                <div className="w-full bg-[#101311] h-2.5 rounded-full overflow-hidden border border-[#24332a]">
                  <div
                    className="bg-gradient-to-r from-[#174d35] to-[#43b879] h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* 7 Daily Columns / Cards */}
              <div>
                <div className="text-[11px] font-semibold text-[#a6aea9] uppercase tracking-wider mb-2">
                  Daily Earned Points ({selectedWeek.startFormatted} to {selectedWeek.endFormatted})
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {selectedWeek.days.map(d => {
                    const dayPoints = dailyBreakdown[d.dateString] || 0;
                    return (
                      <div
                        key={d.dateString}
                        className={`p-2 sm:p-2.5 rounded-xl border text-center flex flex-col justify-between transition-all ${
                          d.isToday
                            ? 'bg-[#1a2e23] border-[#43b879] shadow-sm'
                            : 'bg-[#101311] border-[#24332a]'
                        }`}
                      >
                        <div>
                          <div className="text-[10px] font-semibold text-[#a6aea9]">{d.dayName}</div>
                          <div className="text-xs font-bold text-white mt-0.5">{d.dayNumber}</div>
                        </div>

                        <div className="mt-2 pt-1 border-t border-[#24332a]">
                          <span
                            className={`text-xs sm:text-sm font-black ${
                              dayPoints > 0 ? 'text-[#43b879]' : 'text-[#a6aea9]/50'
                            }`}
                          >
                            {dayPoints > 0 ? `+${dayPoints}` : '0'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
