import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { Child } from '../../types';
import { X, UserPlus, Edit3, Sparkles } from 'lucide-react';

interface ChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  childToEdit?: Child | null;
}

const AVATAR_OPTIONS = ['👦', '👧', '🧑', '🧒', '👶', '🦸‍♂️', '🦸‍♀️', '🎨', '🚀', '⭐', '🦁', '🐬', '⚽', '📚'];
const COLOR_OPTIONS = [
  '#43b879', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Teal
  '#6366f1', // Indigo
];

export const ChildModal: React.FC<ChildModalProps> = ({ isOpen, onClose, childToEdit }) => {
  const { addChild, updateChild, settings } = useFamily();

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const [color, setColor] = useState('#43b879');
  const [age, setAge] = useState<string>('');
  const [weeklyGoal, setWeeklyGoal] = useState<number>(settings.defaultWeeklyGoal || 50);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (childToEdit) {
      setName(childToEdit.name);
      setNickname(childToEdit.nickname || '');
      setAvatar(childToEdit.avatar || '👦');
      setColor(childToEdit.color || '#43b879');
      setAge(childToEdit.age ? String(childToEdit.age) : '');
      setWeeklyGoal(childToEdit.weeklyGoal || settings.defaultWeeklyGoal || 50);
      setNotes(childToEdit.notes || '');
    } else {
      setName('');
      setNickname('');
      setAvatar('👦');
      setColor('#43b879');
      setAge('');
      setWeeklyGoal(settings.defaultWeeklyGoal || 50);
      setNotes('');
    }
    setError(null);
  }, [childToEdit, isOpen, settings.defaultWeeklyGoal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Child's name is required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (childToEdit) {
        await updateChild(childToEdit.id, {
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          avatar,
          color,
          age: age ? parseInt(age, 10) : undefined,
          weeklyGoal: Number(weeklyGoal),
          notes: notes.trim() || undefined,
        });
      } else {
        await addChild({
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          avatar,
          color,
          age: age ? parseInt(age, 10) : undefined,
          weeklyGoal: Number(weeklyGoal),
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save child profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151a17] border border-[#24332a] w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#24332a] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#174d35]/50 border border-[#43b879]/30 text-[#43b879]">
              {childToEdit ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {childToEdit ? `Edit ${childToEdit.name}'s Profile` : 'Add a Child'}
              </h2>
              <p className="text-xs text-[#a6aea9]">Children are managed privately by Mom</p>
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
          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-2">
              Choose Avatar
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center shrink-0 border transition-all ${
                    avatar === emoji
                      ? 'bg-[#174d35] border-[#43b879] scale-110 shadow-md'
                      : 'bg-[#101311] border-[#24332a] hover:border-[#33483b]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color accent */}
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-2">
              Card Accent Color
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Liam"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Nickname (Optional)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="e.g. Leo"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Age (Optional)
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="e.g. 9"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Weekly Goal (pts)
              </label>
              <input
                type="number"
                min={10}
                max={1000}
                value={weeklyGoal}
                onChange={e => setWeeklyGoal(parseInt(e.target.value, 10) || 50)}
                placeholder="50"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Notes / Reminders (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Favorite incentives, special goals"
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879] resize-none"
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
              className="flex-1 bg-[#174d35] hover:bg-[#1e6143] text-white py-2.5 rounded-xl border border-[#43b879]/40 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#43b879]" />
              <span>{isSubmitting ? 'Saving...' : childToEdit ? 'Save Changes' : 'Add Child'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
