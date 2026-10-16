import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { Reward } from '../../types';
import { X, Gift, Sparkles } from 'lucide-react';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardToEdit?: Reward | null;
}

const REWARD_ICONS = ['🎁', '🍿', '🎮', '🍦', '🍕', '🎳', '🚲', '⛺', '🎟️', '👑', '🏊‍♂️', '🎨', '🏖️', '🍩'];

export const RewardModal: React.FC<RewardModalProps> = ({ isOpen, onClose, rewardToEdit }) => {
  const { createReward, updateReward } = useFamily();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState<number>(30);
  const [icon, setIcon] = useState('🎁');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rewardToEdit) {
      setTitle(rewardToEdit.title);
      setDescription(rewardToEdit.description || '');
      setPointsRequired(rewardToEdit.pointsRequired);
      setIcon(rewardToEdit.icon || '🎁');
    } else {
      setTitle('');
      setDescription('');
      setPointsRequired(30);
      setIcon('🎁');
    }
    setError(null);
  }, [rewardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Reward title is required.');
      return;
    }
    if (!pointsRequired || pointsRequired <= 0) {
      setError('Points required must be greater than zero.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (rewardToEdit) {
        await updateReward(rewardToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          pointsRequired: Math.round(pointsRequired),
          icon,
        });
      } else {
        await createReward({
          title: title.trim(),
          description: description.trim() || undefined,
          pointsRequired: Math.round(pointsRequired),
          icon,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save reward.');
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
              <h2 className="text-lg font-semibold text-white">
                {rewardToEdit ? 'Edit Reward' : 'Create New Reward'}
              </h2>
              <p className="text-xs text-[#a6aea9]">Fun incentives your children can earn</p>
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
          <div className="mb-4 bg-[#291717] border border-[#6b2c2c] rounded-xl p-3 text-sm text-[#fca5a5]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-2">
              Reward Icon
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {REWARD_ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center shrink-0 border transition-all ${
                    icon === i
                      ? 'bg-[#174d35] border-[#43b879] scale-110 shadow-md'
                      : 'bg-[#101311] border-[#24332a] hover:border-[#33483b]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Reward Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Family Movie Night Pick, Ice Cream Trip"
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Choose any family film for Saturday night"
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Points Required to Redeem *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={pointsRequired}
                onChange={e => setPointsRequired(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-28 bg-[#101311] border border-[#24332a] rounded-xl px-3 py-2 text-base font-bold text-center text-white focus:outline-none focus:border-[#43b879]"
              />
              <div className="flex gap-1">
                {[20, 30, 50, 100].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPointsRequired(p)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      pointsRequired === p
                        ? 'bg-[#174d35] border-[#43b879] text-white'
                        : 'bg-[#101311] border-[#24332a] text-[#a6aea9] hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
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
              disabled={isSubmitting}
              className="flex-1 bg-[#174d35] hover:bg-[#1e6143] text-white py-2.5 rounded-xl border border-[#43b879]/40 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#43b879]" />
              <span>{isSubmitting ? 'Saving...' : rewardToEdit ? 'Save Changes' : 'Create Reward'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
