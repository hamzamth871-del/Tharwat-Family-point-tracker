import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { X, Award, Plus, Minus, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AwardPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedChildId?: string | null;
}

const PRESET_REASONS = [
  'Helped without being asked',
  'Excellent effort with homework',
  'Did an extra chore around the house',
  'Showed great patience & kindness',
  'Cleaned up immediately when asked',
  'Special weekend family bonus',
];

export const AwardPointsModal: React.FC<AwardPointsModalProps> = ({
  isOpen,
  onClose,
  preselectedChildId,
}) => {
  const {
    children,
    settings,
    awardPoints,
    adjustPoints,
    getChildWeeklyPoints,
    getChildTotalBalance,
  } = useFamily();

  const activeChildren = children.filter(c => !c.archived);

  const [childId, setChildId] = useState<string>('');
  const [points, setPoints] = useState<number>(10);
  const [isDeduction, setIsDeduction] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedChildId) {
      setChildId(preselectedChildId);
    } else if (activeChildren.length > 0 && !childId) {
      setChildId(activeChildren[0].id);
    }
  }, [preselectedChildId, activeChildren, childId]);

  if (!isOpen) return null;

  const selectedChild = children.find(c => c.id === childId);
  const currentWeekly = selectedChild ? getChildWeeklyPoints(selectedChild.id) : 0;
  const currentTotal = selectedChild ? getChildTotalBalance(selectedChild.id) : 0;

  const appliedPoints = isDeduction ? -Math.abs(points) : Math.abs(points);
  const projectedWeekly = currentWeekly + appliedPoints;
  const projectedTotal = currentTotal + appliedPoints;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) {
      setError('Please select a child.');
      return;
    }
    if (!points || points <= 0) {
      setError('Please specify a positive point amount.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for this point entry.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (isDeduction) {
        await adjustPoints(childId, -Math.abs(points), reason);
      } else {
        await awardPoints(childId, Math.abs(points), reason);
        // Playful celebration
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#43b879', '#174d35', '#ffffff'],
        });
      }
      onClose();
      setReason('');
      setPoints(10);
      setIsDeduction(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit points.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151a17] border border-[#24332a] w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#24332a] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#174d35]/50 border border-[#43b879]/30 text-[#43b879]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Manual Point Control</h2>
              <p className="text-xs text-[#a6aea9]">Award or adjust points with full ledger tracking</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Switch: Award vs Adjust (if negative allowed) */}
          {settings.allowNegativePoints && (
            <div className="grid grid-cols-2 gap-2 bg-[#101311] p-1 rounded-xl border border-[#24332a]">
              <button
                type="button"
                onClick={() => setIsDeduction(false)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  !isDeduction
                    ? 'bg-[#174d35] text-white border border-[#43b879]/40 shadow-sm'
                    : 'text-[#a6aea9] hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-[#43b879]" />
                <span>Award Points</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeduction(true)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isDeduction
                    ? 'bg-[#3d1818] text-white border border-[#ef4444]/40 shadow-sm'
                    : 'text-[#a6aea9] hover:text-white'
                }`}
              >
                <Minus className="w-3.5 h-3.5 text-[#ef4444]" />
                <span>Subtract Points</span>
              </button>
            </div>
          )}

          {/* Child selection */}
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Select Child
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeChildren.map(c => {
                const isSelected = c.id === childId;
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
                    <div className="truncate">
                      <div className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : ''}`}>
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[#a6aea9]">
                        {getChildWeeklyPoints(c.id)} pts this wk
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Points value with quick presets */}
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              {isDeduction ? 'Points to Subtract' : 'Points to Award'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={500}
                required
                value={points}
                onChange={e => setPoints(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 bg-[#101311] border border-[#24332a] rounded-xl px-3 py-2 text-lg font-bold text-center text-white focus:outline-none focus:border-[#43b879]"
              />
              <div className="flex-1 flex flex-wrap gap-1.5">
                {[5, 10, 15, 20, 30].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPoints(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      points === val
                        ? 'bg-[#174d35] border-[#43b879] text-white'
                        : 'bg-[#101311] border-[#24332a] text-[#a6aea9] hover:text-white'
                    }`}
                  >
                    {isDeduction ? `-${val}` : `+${val}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Reason / Explanation
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Cleaned up without asking, great attitude"
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
            />
            {/* Quick preset reasons */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[11px] bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white px-2.5 py-1 rounded-md border border-[#24332a] truncate max-w-full"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Balance Preview Card */}
          {selectedChild && (
            <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3 text-xs space-y-1.5">
              <div className="text-[#a6aea9] font-medium flex justify-between">
                <span>Current Weekly Balance:</span>
                <span className="font-semibold text-white">{currentWeekly} pts</span>
              </div>
              <div className="text-[#a6aea9] font-medium flex justify-between">
                <span>Adjustment:</span>
                <span className={isDeduction ? 'font-bold text-[#ef4444]' : 'font-bold text-[#43b879]'}>
                  {isDeduction ? `-${points}` : `+${points}`} pts
                </span>
              </div>
              <div className="pt-1.5 border-t border-[#24332a] flex justify-between items-center text-sm">
                <span className="font-bold text-white">Projected Weekly Total:</span>
                <span
                  className={`font-black text-base ${
                    projectedWeekly >= 0 ? 'text-[#43b879]' : 'text-[#ef4444]'
                  }`}
                >
                  {projectedWeekly} pts
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
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
              disabled={isSubmitting || !selectedChild}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all ${
                isDeduction
                  ? 'bg-[#7f1d1d] hover:bg-[#991b1b] border border-[#ef4444]/40'
                  : 'bg-[#174d35] hover:bg-[#1e6143] border border-[#43b879]/40'
              } disabled:opacity-50`}
            >
              <Award className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : isDeduction ? 'Confirm Deduction' : 'Confirm Award'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
