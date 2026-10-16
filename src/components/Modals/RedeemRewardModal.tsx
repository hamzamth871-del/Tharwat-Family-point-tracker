import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { Reward } from '../../types';
import { X, Gift, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RedeemRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  preselectedChildId?: string | null;
}

export const RedeemRewardModal: React.FC<RedeemRewardModalProps> = ({
  isOpen,
  onClose,
  reward,
  preselectedChildId,
}) => {
  const {
    children,
    settings,
    redeemReward,
    getChildTotalBalance,
  } = useFamily();

  const activeChildren = children.filter(c => !c.archived);

  const [childId, setChildId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedChildId) {
      setChildId(preselectedChildId);
    } else if (activeChildren.length > 0) {
      setChildId(activeChildren[0].id);
    }
    setNotes('');
    setError(null);
  }, [reward, preselectedChildId, isOpen]);

  if (!isOpen || !reward) return null;

  const selectedChild = children.find(c => c.id === childId);
  const currentBalance = selectedChild ? getChildTotalBalance(selectedChild.id) : 0;
  const deductsPoints = settings.rewardsDeductPoints;
  const hasEnoughPoints = !deductsPoints || currentBalance >= reward.pointsRequired;
  const projectedBalance = deductsPoints ? currentBalance - reward.pointsRequired : currentBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) {
      setError('Please select which child is redeeming this reward.');
      return;
    }

    if (deductsPoints && currentBalance < reward.pointsRequired) {
      setError(`Not enough points. Required: ${reward.pointsRequired}, Current: ${currentBalance}`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await redeemReward(reward.id, childId, notes);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#43b879', '#fbbf24', '#ffffff'],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to redeem reward.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151a17] border border-[#24332a] w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#24332a] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#174d35]/50 border border-[#43b879]/30 text-[#43b879]">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Redeem Reward</h2>
              <p className="text-xs text-[#a6aea9]">Confirm family reward redemption</p>
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

        {error && (
          <div className="mb-4 bg-[#291717] border border-[#6b2c2c] rounded-xl p-3 text-sm text-[#fca5a5] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ef4444]" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-[#101311] border border-[#24332a] rounded-xl p-4 mb-4 flex items-center gap-3.5">
          <span className="text-3xl">{reward.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-white truncate">{reward.title}</div>
            {reward.description && (
              <div className="text-xs text-[#a6aea9] truncate">{reward.description}</div>
            )}
            <div className="text-xs text-[#43b879] font-semibold mt-1">
              Cost: {reward.pointsRequired} points
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Select Child
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activeChildren.map(c => {
                const isSelected = c.id === childId;
                const bal = getChildTotalBalance(c.id);
                const canAfford = !deductsPoints || bal >= reward.pointsRequired;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChildId(c.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-[#1a2b21] border-[#43b879] shadow-sm'
                        : 'bg-[#101311] border-[#24332a] text-[#a6aea9] hover:border-[#33483b]'
                    }`}
                  >
                    <span className="text-xl">{c.avatar}</span>
                    <div className="truncate flex-1">
                      <div className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : ''}`}>
                        {c.name}
                      </div>
                      <div className={`text-[10px] ${canAfford ? 'text-[#43b879]' : 'text-[#ef4444]'}`}>
                        {bal} pts available
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balance Preview Card */}
          {selectedChild && (
            <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3 text-xs space-y-1.5">
              <div className="text-[#a6aea9] flex justify-between">
                <span>Available Total Points:</span>
                <span className="font-semibold text-white">{currentBalance} pts</span>
              </div>
              <div className="text-[#a6aea9] flex justify-between">
                <span>Points Deducted:</span>
                <span className="font-bold text-[#ef4444]">
                  {deductsPoints ? `-${reward.pointsRequired} pts` : '0 pts (Milestone only)'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-[#24332a] flex justify-between items-center text-sm">
                <span className="font-bold text-white">Remaining Balance:</span>
                <span
                  className={`font-black text-base ${
                    hasEnoughPoints ? 'text-[#43b879]' : 'text-[#ef4444]'
                  }`}
                >
                  {projectedBalance} pts
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Special Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. For Saturday night movie, ice cream flavor"
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white py-2.5 rounded-xl border border-[#24332a] text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedChild || !hasEnoughPoints}
              className="flex-1 bg-[#174d35] hover:bg-[#1e6143] text-white py-2.5 rounded-xl border border-[#43b879]/40 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#43b879]" />
              <span>{isSubmitting ? 'Redeeming...' : 'Confirm Reward'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
