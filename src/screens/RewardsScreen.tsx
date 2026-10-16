import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Reward, Child } from '../types';
import {
  Gift,
  Plus,
  Sparkles,
  Edit3,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
} from 'lucide-react';

interface RewardsScreenProps {
  onOpenCreateReward: () => void;
  onEditReward: (reward: Reward) => void;
  onRedeemReward: (reward: Reward) => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  onOpenCreateReward,
  onEditReward,
  onRedeemReward,
}) => {
  const {
    rewards,
    children,
    redemptions,
    settings,
    updateReward,
    archiveReward,
    getChildTotalBalance,
  } = useFamily();

  const [showArchived, setShowArchived] = useState(false);
  const activeChildren = children.filter(c => !c.archived);

  const displayedRewards = rewards.filter(r => (showArchived ? true : !r.archived));
  const archivedCount = rewards.filter(r => r.archived).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#43b879]" />
            <span>Family Rewards Store</span>
          </h1>
          <p className="text-xs text-[#a6aea9]">
            Incentives, privileges, and fun treats that children can redeem with their points
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
            onClick={onOpenCreateReward}
            className="px-4 py-2 bg-[#174d35] hover:bg-[#1e6143] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#43b879]/40 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#43b879]" />
            <span>Create Reward</span>
          </button>
        </div>
      </div>

      {/* Rewards Rules Info Card */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#174d35]/40 text-[#43b879] border border-[#43b879]/30">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Redemption Rule: </span>
            <span className="text-[#a6aea9]">
              {settings.rewardsDeductPoints
                ? 'Redeeming deducts points from the child’s balance'
                : 'Milestone mode (points are celebrated without deduction)'}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-[#43b879] font-medium">
          Configurable in Settings
        </div>
      </div>

      {/* Available Rewards Grid */}
      {displayedRewards.length === 0 ? (
        <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#174d35]/30 text-[#43b879] flex items-center justify-center mx-auto mb-3">
            <Gift className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No rewards created yet</h3>
          <p className="text-xs text-[#a6aea9] mb-4">
            Add movie nights, weekend outings, or special privileges for your children to work towards.
          </p>
          <button
            onClick={onOpenCreateReward}
            className="px-4 py-2 bg-[#174d35] hover:bg-[#1e6143] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#43b879]" />
            <span>Create First Reward</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRewards.map(reward => {
            return (
              <div
                key={reward.id}
                className={`bg-[#151a17] border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all ${
                  reward.archived
                    ? 'border-[#3d1818] opacity-60'
                    : 'border-[#24332a] hover:border-[#33483b]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#101311] border border-[#24332a] flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {reward.icon}
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-xl bg-[#174d35] text-[#43b879] text-xs font-black border border-[#43b879]/40">
                        {reward.pointsRequired} pts
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{reward.title}</h3>
                  {reward.description && (
                    <p className="text-xs text-[#a6aea9] line-clamp-2 mb-4">
                      {reward.description}
                    </p>
                  )}
                </div>

                {/* Redeem buttons for each child with affordability indicators */}
                <div className="pt-3 border-t border-[#24332a] space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#a6aea9]">
                    Children Progress:
                  </div>

                  <div className="space-y-1">
                    {activeChildren.map(c => {
                      const balance = getChildTotalBalance(c.id);
                      const canRedeem = !settings.rewardsDeductPoints || balance >= reward.pointsRequired;
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-xs bg-[#101311] px-2.5 py-1.5 rounded-lg border border-[#24332a]"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>{c.avatar}</span>
                            <span className="text-white truncate font-medium">{c.name}</span>
                          </div>
                          <span
                            className={`font-semibold text-[11px] ${
                              canRedeem ? 'text-[#43b879]' : 'text-[#a6aea9]'
                            }`}
                          >
                            {balance} / {reward.pointsRequired} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2">
                    <button
                      onClick={() => onRedeemReward(reward)}
                      disabled={reward.archived || activeChildren.length === 0}
                      className="flex-1 bg-[#174d35] hover:bg-[#1e6143] text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#43b879]/40 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#43b879]" />
                      <span>Redeem for Child</span>
                    </button>

                    <button
                      onClick={() => onEditReward(reward)}
                      className="p-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white border border-[#24332a]"
                      title="Edit reward"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => archiveReward(reward.id, !reward.archived)}
                      className="p-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-[#ef4444] border border-[#24332a]"
                      title={reward.archived ? 'Restore' : 'Archive'}
                    >
                      {reward.archived ? (
                        <RotateCcw className="w-3.5 h-3.5 text-[#43b879]" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Redemption Audit History Section */}
      {redemptions.length > 0 && (
        <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#fbbf24]" />
            <span>Recent Redemptions Log ({redemptions.length})</span>
          </h2>

          <div className="space-y-2">
            {redemptions.slice(0, 10).map(red => {
              const rew = rewards.find(r => r.id === red.rewardId);
              const child = children.find(c => c.id === red.childId);

              return (
                <div
                  key={red.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#101311] border border-[#24332a] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{rew ? rew.icon : '🎁'}</span>
                    <div>
                      <div className="text-white font-bold">
                        {child ? child.name : 'Child'} redeemed{' '}
                        <span className="text-[#43b879]">{rew ? rew.title : 'Reward'}</span>
                      </div>
                      <div className="text-[10px] text-[#a6aea9]">
                        {new Date(red.requestedAt).toLocaleString()}
                        {red.notes ? ` • Note: "${red.notes}"` : ''}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-[#174d35]/30 text-[#43b879] border border-[#43b879]/20 font-bold">
                    Fulfilled {red.pointsSpent > 0 ? `(-${red.pointsSpent} pts)` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
