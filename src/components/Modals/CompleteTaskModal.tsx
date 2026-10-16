import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { Task } from '../../types';
import { X, CheckCircle, Sparkles, Clock, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  defaultChildId?: string | null;
}

export const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  defaultChildId,
}) => {
  const { children, completeTask, getChildWeeklyPoints } = useFamily();
  const activeChildren = children.filter(c => !c.archived);

  // Filter children who are eligible for this task
  const eligibleChildren = activeChildren.filter(c => {
    if (!task) return false;
    return task.assignedChildIds.includes('*') || task.assignedChildIds.includes(c.id);
  });

  const [childId, setChildId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultChildId && eligibleChildren.some(c => c.id === defaultChildId)) {
      setChildId(defaultChildId);
    } else if (eligibleChildren.length > 0) {
      setChildId(eligibleChildren[0].id);
    }
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError(null);
  }, [task, defaultChildId, isOpen]);

  if (!isOpen || !task) return null;

  const selectedChild = children.find(c => c.id === childId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) {
      setError('Please select which child completed this task.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await completeTask(task.id, childId, date, notes);
      if (!task.requireApproval) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#43b879', '#174d35', '#ffffff'],
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete task.');
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
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Record Completion</h2>
              <p className="text-xs text-[#a6aea9]">+{task.points} points upon approval</p>
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

        <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">{task.title}</span>
            <span className="px-2 py-0.5 rounded-lg bg-[#174d35] text-[#43b879] text-xs font-bold border border-[#43b879]/30">
              +{task.points} pts
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-[#a6aea9] mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="mt-2 text-[11px] text-[#43b879] flex items-center gap-1.5">
            {task.requireApproval ? (
              <>
                <Clock className="w-3 h-3 text-[#fbbf24]" />
                <span className="text-[#fbbf24]">Requires Mom's approval before points are awarded</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Points will be awarded immediately to child's ledger</span>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Which Child Did This?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {eligibleChildren.map(c => {
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
                        {getChildWeeklyPoints(c.id)} pts
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Completion Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Notes / Evidence (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Put all books away, vacuumed"
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
              disabled={isSubmitting || !selectedChild}
              className="flex-1 bg-[#174d35] hover:bg-[#1e6143] text-white py-2.5 rounded-xl border border-[#43b879]/40 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-[#43b879]" />
              <span>{isSubmitting ? 'Recording...' : 'Mark Completed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
