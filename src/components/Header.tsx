import React from 'react';
import { useFamily } from '../context/FamilyContext';
import { ChevronLeft, ChevronRight, Award, Trophy, Bell, Calendar } from 'lucide-react';

interface HeaderProps {
  onOpenAwardModal: () => void;
  onOpenLeaderboardModal: () => void;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAwardModal,
  onOpenLeaderboardModal,
  onSelectTab,
}) => {
  const {
    admin,
    settings,
    selectedWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    pendingApprovals,
  } = useFamily();

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = admin?.displayName || 'Mom';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-[#101311]/90 backdrop-blur-md border-b border-[#24332a] px-4 py-3 sm:py-3.5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Branding & Greeting */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#174d35] border border-[#43b879]/30 flex items-center justify-center text-[#43b879] shadow-sm font-bold">
              FP
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>{settings.familyName || 'Family Points'}</span>
              </h1>
              <p className="text-xs text-[#a6aea9]">{getGreeting()}</p>
            </div>
          </div>

          {/* Mobile Right: Quick Actions */}
          <div className="flex items-center gap-1.5 sm:hidden">
            {pendingApprovals.length > 0 && (
              <button
                onClick={() => onSelectTab('tasks')}
                className="relative p-2 rounded-xl bg-[#2a2212] border border-[#fbbf24]/40 text-[#fbbf24] hover:bg-[#362b16]"
                title="Pending Approvals"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingApprovals.length}
                </span>
              </button>
            )}

            <button
              onClick={onOpenAwardModal}
              className="p-2 rounded-xl bg-[#174d35] border border-[#43b879]/40 text-white hover:bg-[#1e6143]"
              title="Award Points"
            >
              <Award className="w-4 h-4 text-[#43b879]" />
            </button>
          </div>
        </div>

        {/* Center / Right: Week Selector & Desktop Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {/* Week Selector pill */}
          <div className="flex items-center bg-[#151a17] border border-[#24332a] rounded-xl p-1 text-xs">
            <button
              onClick={goToPreviousWeek}
              className="p-1 rounded-lg text-[#a6aea9] hover:text-white hover:bg-[#1f2923] transition-colors"
              title="Previous Week"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={goToCurrentWeek}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                selectedWeek.isCurrentWeek
                  ? 'text-white'
                  : 'text-[#43b879] hover:underline font-bold'
              }`}
              title="Click to reset to current week"
            >
              <Calendar className="w-3.5 h-3.5 text-[#43b879]" />
              <span>{selectedWeek.displayRange}</span>
              {!selectedWeek.isCurrentWeek && (
                <span className="text-[10px] bg-[#174d35] text-[#43b879] px-1.5 py-0.2 rounded font-semibold">
                  Today
                </span>
              )}
            </button>

            <button
              onClick={goToNextWeek}
              className="p-1 rounded-lg text-[#a6aea9] hover:text-white hover:bg-[#1f2923] transition-colors"
              title="Next Week"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop quick actions */}
          <div className="hidden sm:flex items-center gap-2">
            {settings.leaderboardEnabled && (
              <button
                onClick={onOpenLeaderboardModal}
                className="px-3 py-1.5 rounded-xl bg-[#151a17] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white border border-[#24332a] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>Leaderboard</span>
              </button>
            )}

            {pendingApprovals.length > 0 && (
              <button
                onClick={() => onSelectTab('tasks')}
                className="px-3 py-1.5 rounded-xl bg-[#2a2212] hover:bg-[#362b16] text-[#fbbf24] border border-[#fbbf24]/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{pendingApprovals.length} Pending</span>
              </button>
            )}

            <button
              onClick={onOpenAwardModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#174d35] hover:bg-[#1e6143] text-white border border-[#43b879]/40 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-[#43b879]" />
              <span>Award Points</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
