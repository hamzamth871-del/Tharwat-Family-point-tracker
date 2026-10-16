import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { Task, TaskCategory } from '../../types';
import { X, CheckSquare, Sparkles, BookOpen, Sparkle, Heart, Smile, Activity, HelpCircle } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

const CATEGORIES: { key: TaskCategory; label: string; icon: any }[] = [
  { key: 'homework', label: 'Homework & Study', icon: BookOpen },
  { key: 'cleaning', label: 'Cleaning & Tidying', icon: Sparkle },
  { key: 'helping', label: 'Helping at Home', icon: Heart },
  { key: 'responsibility', label: 'Personal Responsibility', icon: CheckSquare },
  { key: 'habits', label: 'Healthy Habits', icon: Activity },
  { key: 'kindness', label: 'Kindness & Behavior', icon: Smile },
  { key: 'other', label: 'Other', icon: HelpCircle },
];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const { createTask, updateTask, children, settings } = useFamily();
  const activeChildren = children.filter(c => !c.archived);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<number>(10);
  const [category, setCategory] = useState<TaskCategory>('helping');
  const [assignedChildIds, setAssignedChildIds] = useState<string[]>(['*']);
  const [repeatSchedule, setRepeatSchedule] = useState<'once' | 'daily' | 'weekdays' | 'weekends' | 'weekly'>('daily');
  const [requireApproval, setRequireApproval] = useState<boolean>(settings.defaultRequireApproval);
  const [repeatable, setRepeatable] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPoints(taskToEdit.points);
      setCategory(taskToEdit.category);
      setAssignedChildIds(taskToEdit.assignedChildIds);
      setRepeatSchedule(taskToEdit.repeatSchedule);
      setRequireApproval(taskToEdit.requireApproval);
      setRepeatable(taskToEdit.repeatable);
      setDueDate(taskToEdit.dueDate || '');
      setDueTime(taskToEdit.dueTime || '');
    } else {
      setTitle('');
      setDescription('');
      setPoints(10);
      setCategory('helping');
      setAssignedChildIds(['*']);
      setRepeatSchedule('daily');
      setRequireApproval(settings.defaultRequireApproval);
      setRepeatable(false);
      setDueDate('');
      setDueTime('');
    }
    setError(null);
  }, [taskToEdit, isOpen, settings.defaultRequireApproval]);

  if (!isOpen) return null;

  const toggleChildAssignment = (cId: string) => {
    if (cId === '*') {
      setAssignedChildIds(['*']);
      return;
    }

    let next = assignedChildIds.filter(id => id !== '*');
    if (next.includes(cId)) {
      next = next.filter(id => id !== cId);
    } else {
      next.push(cId);
    }

    if (next.length === 0 || next.length === activeChildren.length) {
      setAssignedChildIds(['*']);
    } else {
      setAssignedChildIds(next);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!points || points <= 0) {
      setError('Points must be greater than zero.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: Partial<Task> = {
        title: title.trim(),
        description: description.trim() || undefined,
        points: Math.round(points),
        category,
        assignedChildIds,
        repeatSchedule,
        requireApproval,
        repeatable,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, payload);
      } else {
        await createTask(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151a17] border border-[#24332a] w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#24332a] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#174d35]/50 border border-[#43b879]/30 text-[#43b879]">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {taskToEdit ? 'Edit Task' : 'Create Family Task'}
              </h2>
              <p className="text-xs text-[#a6aea9]">Customize requirements, points, and schedule</p>
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
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Clean bedroom, Finish reading, Set the table"
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Description / Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Put clothes in hamper, vacuum rug, make bed neatly"
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Points Earned *
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={points}
                  onChange={e => setPoints(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 bg-[#101311] border border-[#24332a] rounded-xl px-3 py-2 text-base font-bold text-center text-white focus:outline-none focus:border-[#43b879]"
                />
                <div className="flex gap-1">
                  {[5, 10, 15, 20].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPoints(p)}
                      className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                        points === p
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

            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Repeat Schedule
              </label>
              <select
                value={repeatSchedule}
                onChange={e => setRepeatSchedule(e.target.value as any)}
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              >
                <option value="daily">Daily (Every Day)</option>
                <option value="weekdays">Weekdays (Mon - Fri)</option>
                <option value="weekends">Weekends (Sat & Sun)</option>
                <option value="weekly">Weekly (Once a week)</option>
                <option value="once">One-Time Only</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all text-left ${
                      isSelected
                        ? 'bg-[#174d35] border-[#43b879] text-white shadow-sm'
                        : 'bg-[#101311] border-[#24332a] text-[#a6aea9] hover:border-[#33483b]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-[#43b879]" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Children */}
          <div>
            <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
              Assign To
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleChildAssignment('*')}
                className={`py-1.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  assignedChildIds.includes('*')
                    ? 'bg-[#174d35] border-[#43b879] text-white shadow-sm'
                    : 'bg-[#101311] border-[#24332a] text-[#a6aea9] hover:border-[#33483b]'
                }`}
              >
                🌟 All Children
              </button>
              {activeChildren.map(c => {
                const isAssigned = assignedChildIds.includes('*') || assignedChildIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChildAssignment(c.id)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isAssigned && !assignedChildIds.includes('*')
                        ? 'bg-[#174d35] border-[#43b879] text-white shadow-sm'
                        : 'bg-[#101311] border-[#24332a] text-[#a6aea9] hover:border-[#33483b]'
                    }`}
                  >
                    <span>{c.avatar}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Approval & Multi-completion Toggles */}
          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-3 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Requires Mom's Approval</div>
                <div className="text-[11px] text-[#a6aea9]">
                  Task goes into pending review before points are granted
                </div>
              </div>
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={e => setRequireApproval(e.target.checked)}
                className="w-4 h-4 accent-[#43b879] rounded cursor-pointer"
              />
            </label>

            <div className="border-t border-[#24332a] pt-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">Can Be Completed Multiple Times</div>
                  <div className="text-[11px] text-[#a6aea9]">
                    Allows earning points multiple times on the same day (e.g. practicing, helping)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={repeatable}
                  onChange={e => setRepeatable(e.target.checked)}
                  className="w-4 h-4 accent-[#43b879] rounded cursor-pointer"
                />
              </label>
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
              <span>{isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
