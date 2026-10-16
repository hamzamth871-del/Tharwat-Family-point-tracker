import React from 'react';
import { useFamily } from '../../context/FamilyContext';
import { X, Trophy, Medal, Award, Sparkles } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { leaderboard, selectedWeek } = useFamily();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151a17] border border-[#24332a] w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#24332a] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#174d35]/50 border border-[#43b879]/30 text-[#43b879]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Family Leaderboard</h2>
              <p className="text-xs text-[#a6aea9]">{selectedWeek.displayRange}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a6aea9] hover:text-white hover:bg-[#1a231e]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#a6aea9]">
            No active children found in the family yet.
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map(item => {
              const isFirst = item.rank === 1;
              const isSecond = item.rank === 2;
              const isThird = item.rank === 3;

              return (
                <div
                  key={item.child.id}
                  className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${
                    isFirst
                      ? 'bg-gradient-to-r from-[#174d35]/60 to-[#151a17] border-[#43b879] shadow-md'
                      : 'bg-[#101311] border-[#24332a]'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                    {isFirst && <Trophy className="w-5 h-5 text-[#fbbf24]" />}
                    {isSecond && <Medal className="w-5 h-5 text-[#94a3b8]" />}
                    {isThird && <Award className="w-5 h-5 text-[#b45309]" />}
                    {!isFirst && !isSecond && !isThird && (
                      <span className="text-[#a6aea9]">#{item.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    style={{ backgroundColor: `${item.child.color}25` }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-[#24332a]"
                  >
                    {item.child.avatar}
                  </div>

                  {/* Name & Goal */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                      <span>{item.child.name}</span>
                      {isFirst && (
                        <span className="text-[10px] bg-[#fbbf24]/20 text-[#fbbf24] px-1.5 py-0.2 rounded font-semibold border border-[#fbbf24]/30">
                          Leader
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#a6aea9] flex items-center gap-2 mt-0.5">
                      <span>{item.completedTasks} tasks done</span>
                      <span>&bull;</span>
                      <span>{item.goalPercentage}% of goal</span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-[#43b879]">
                      {item.weeklyPoints}
                    </div>
                    <div className="text-[10px] text-[#a6aea9]">pts this wk</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-[#24332a] text-center">
          <p className="text-[11px] text-[#a6aea9]">
            Friendly encouragement for effort, responsibility, and teamwork!
          </p>
        </div>
      </div>
    </div>
  );
};
