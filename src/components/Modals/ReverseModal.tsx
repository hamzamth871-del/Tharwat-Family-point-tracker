import React, { useState } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { PointTransaction } from '../../types';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';

interface ReverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PointTransaction | null;
}

export const ReverseModal: React.FC<ReverseModalProps> = ({ isOpen, onClose, transaction }) => {
  const { reverseTransaction, children } = useFamily();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const child = children.find(c => c.id === transaction.childId);
  const offsetPoints = -transaction.points;

  const handleReverse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await reverseTransaction(
        transaction.id,
        reason.trim() || `Reversal of: ${transaction.reason}`
      );
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to reverse transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151a17] border border-[#24332a] w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#24332a] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#3d1818] border border-[#ef4444]/30 text-[#ef4444]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Reverse Transaction</h2>
              <p className="text-xs text-[#a6aea9]">Create offsetting audit entry</p>
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

        <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5 mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#a6aea9]">
            <span>Child:</span>
            <span className="font-semibold text-white">{child ? child.name : 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between text-[#a6aea9]">
            <span>Original Transaction:</span>
            <span className="font-medium text-white truncate max-w-[200px]">{transaction.reason}</span>
          </div>
          <div className="flex items-center justify-between text-[#a6aea9]">
            <span>Original Points:</span>
            <span className="font-bold text-white">{transaction.points > 0 ? `+${transaction.points}` : transaction.points} pts</span>
          </div>
          <div className="border-t border-[#24332a] pt-2 flex items-center justify-between text-sm">
            <span className="text-[#a6aea9]">Correction Offset:</span>
            <span className="font-bold text-[#ef4444]">
              {offsetPoints > 0 ? `+${offsetPoints}` : offsetPoints} pts
            </span>
          </div>
        </div>

        <form onSubmit={handleReverse} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Correction Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Accidental double entry, wrong child selected"
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ef4444]"
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
              disabled={isSubmitting}
              className="flex-1 bg-[#7f1d1d] hover:bg-[#991b1b] text-white py-2.5 rounded-xl border border-[#ef4444]/40 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSubmitting ? 'Reversing...' : 'Confirm Reversal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
