import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Task, TaskCategory, Child } from '../types';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Edit3,
  Pause,
  Play,
  Archive,
  RotateCcw,
  Sparkles,
  BookOpen,
  Heart,
  Activity,
  Smile,
  Sparkle,
  HelpCircle,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TasksScreenProps {
  onOpenCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
}

const CATEGORY_FILTERS: { key: string; label: string; icon: any }[] = [
  { key: 'all', label: 'All Categories', icon: CheckSquare },
  { key: 'homework', label: 'Homework', icon: BookOpen },
  { key: 'cleaning', label: 'Cleaning', icon: Sparkle },
  { key: 'helping', label: 'Helping', icon: Heart },
  { key: 'responsibility', label: 'Responsibility', icon: CheckSquare },
  { key: 'habits', label: 'Habits', icon: Activity },
  { key: 'kindness', label: 'Kindness', icon: Smile },
  { key: 'other', label: 'Other', icon: HelpCircle },
];

export const TasksScreen: React.FC<TasksScreenProps> = ({
  onOpenCreateTask,
  onEditTask,
  onCompleteTask,
}) => {
  const {
    tasks,
    children,
    pendingApprovals,
    approveCompletion,
    rejectCompletion,
    duplicateTask,
    updateTask,
    archiveTask,
    seedStarterPack,
  } = useFamily();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChildFilter, setSelectedChildFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | 'archived'>('active');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const activeChildren = children.filter(c => !c.archived);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    // Status filter
    if (statusFilter === 'archived' && !t.archived) return false;
    if (statusFilter !== 'archived' && t.archived) return false;
    if (statusFilter === 'paused' && t.active) return false;
    if (statusFilter === 'active' && !t.active) return false;

    // Category filter
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

    // Child filter
    if (selectedChildFilter !== 'all') {
      if (!t.assignedChildIds.includes('*') && !t.assignedChildIds.includes(selectedChildFilter)) {
        return false;
      }
    }

    return true;
  });

  const handleApprove = async (completionId: string) => {
    await approveCompletion(completionId);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#43b879', '#174d35', '#ffffff'],
    });
  };

  const handleConfirmReject = async (completionId: string) => {
    await rejectCompletion(completionId, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  const handleTogglePause = async (task: Task) => {
    await updateTask(task.id, { active: !task.active });
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#43b879]" />
            <span>Tasks & Responsibilities</span>
          </h1>
          <p className="text-xs text-[#a6aea9]">
            Create, assign, approve, and manage recurring family chores
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tasks.length === 0 && (
            <button
              onClick={seedStarterPack}
              className="px-3 py-2 bg-[#101311] hover:bg-[#1a231e] text-[#43b879] rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#43b879]/30 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Starter Chores</span>
            </button>
          )}

          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2 bg-[#174d35] hover:bg-[#1e6143] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#43b879]/40 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#43b879]" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* PENDING APPROVALS SECTION (MANDATORY REQUIREMENT 7) */}
      {pendingApprovals.length > 0 && (
        <div className="bg-[#1a231e] border-2 border-[#fbbf24]/50 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#24332a]">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#fbbf24]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Pending Mom's Approval ({pendingApprovals.length})
              </h2>
            </div>
            <span className="text-xs text-[#fbbf24] font-medium">Review & Award</span>
          </div>

          <div className="space-y-2.5">
            {pendingApprovals.map(approval => {
              const taskTitle = approval.task ? approval.task.title : 'Task';
              const childName = approval.child ? approval.child.name : 'Child';
              const childAvatar = approval.child ? approval.child.avatar : '👦';
              const isRejectingThis = rejectingId === approval.id;

              return (
                <div
                  key={approval.id}
                  className="bg-[#101311] border border-[#24332a] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{childAvatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{childName}</span>
                        <span className="text-[10px] text-[#a6aea9]">
                          submitted on {approval.date}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white mt-0.5">{taskTitle}</div>
                      {approval.notes && (
                        <div className="text-xs text-[#d1d5db] italic mt-0.5">
                          "{approval.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {!isRejectingThis ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setRejectingId(approval.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#291717] hover:bg-[#3d1818] text-[#fca5a5] border border-[#ef4444]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-[#ef4444]" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprove(approval.id)}
                        className="px-4 py-1.5 rounded-xl bg-[#174d35] hover:bg-[#1e6143] text-white border border-[#43b879]/50 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#174d35]/30 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#43b879]" />
                        <span>Approve (+{approval.pointsAwarded} pts)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full sm:w-auto">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason (e.g. not finished yet)"
                        className="w-full sm:w-48 bg-[#151a17] border border-[#ef4444]/40 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => handleConfirmReject(approval.id)}
                          className="flex-1 sm:flex-none px-3 py-1 bg-[#7f1d1d] hover:bg-[#991b1b] text-white rounded-lg text-xs font-semibold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                          className="flex-1 sm:flex-none px-2 py-1 bg-[#101311] text-[#a6aea9] rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters row */}
      <div className="space-y-2.5">
        {/* Category horizontal scroll tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_FILTERS.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#174d35] border-[#43b879] text-white shadow-sm'
                    : 'bg-[#151a17] border-[#24332a] text-[#a6aea9] hover:text-white hover:border-[#33483b]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#43b879]" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary filters: Child filter + Status tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Child filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#a6aea9]">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedChildFilter}
              onChange={e => setSelectedChildFilter(e.target.value)}
              className="bg-[#151a17] border border-[#24332a] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#43b879]"
            >
              <option value="all">All Children</option>
              {activeChildren.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center bg-[#151a17] border border-[#24332a] rounded-xl p-1 text-xs">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-[#174d35] text-white font-bold'
                  : 'text-[#a6aea9] hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'paused'
                  ? 'bg-[#174d35] text-white font-bold'
                  : 'text-[#a6aea9] hover:text-white'
              }`}
            >
              Paused
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'archived'
                  ? 'bg-[#174d35] text-white font-bold'
                  : 'text-[#a6aea9] hover:text-white'
              }`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-8 text-center">
          <CheckSquare className="w-10 h-10 text-[#43b879] mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-white mb-1">No tasks matching filters</h3>
          <p className="text-xs text-[#a6aea9] mb-4">
            Create custom responsibilities or adjust your selected filters.
          </p>
          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2 bg-[#174d35] hover:bg-[#1e6143] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#43b879]" />
            <span>Create New Task</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTasks.map(task => {
            // Find assigned children
            const isAllChildren = task.assignedChildIds.includes('*');
            const assignedList = isAllChildren
              ? activeChildren
              : activeChildren.filter(c => task.assignedChildIds.includes(c.id));

            return (
              <div
                key={task.id}
                className={`bg-[#151a17] border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all ${
                  task.archived
                    ? 'border-[#3d1818] opacity-60'
                    : !task.active
                    ? 'border-[#24332a] opacity-70'
                    : 'border-[#24332a] hover:border-[#33483b]'
                }`}
              >
                <div>
                  {/* Task Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#43b879] bg-[#174d35]/30 px-2 py-0.5 rounded border border-[#43b879]/20">
                          {task.category}
                        </span>
                        <span className="text-[10px] text-[#a6aea9] bg-[#101311] px-2 py-0.5 rounded border border-[#24332a] capitalize">
                          {task.repeatSchedule}
                        </span>
                        {!task.active && !task.archived && (
                          <span className="text-[10px] bg-[#fbbf24]/20 text-[#fbbf24] px-1.5 py-0.2 rounded font-semibold border border-[#fbbf24]/30">
                            Paused
                          </span>
                        )}
                        {task.archived && (
                          <span className="text-[10px] bg-[#3d1818] text-[#ef4444] px-1.5 py-0.2 rounded font-semibold">
                            Archived
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white truncate">{task.title}</h3>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-[#174d35] text-[#43b879] text-sm font-black border border-[#43b879]/40 shadow-sm shrink-0">
                      +{task.points} pts
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-[#a6aea9] line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  )}

                  {/* Assigned Children Badges */}
                  <div className="flex items-center justify-between text-xs text-[#a6aea9] mb-4 pt-1 border-t border-[#24332a]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium">Assigned to:</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {assignedList.map(c => (
                          <span
                            key={c.id}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#101311] border border-[#24332a] text-xs"
                            title={c.name}
                          >
                            {c.avatar}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] text-[#a6aea9]">
                      {task.requireApproval ? (
                        <span className="text-[#fbbf24] font-medium">Approval required</span>
                      ) : (
                        <span className="text-[#43b879]">Auto-approved</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#24332a]">
                  <button
                    onClick={() => onCompleteTask(task)}
                    className="flex-1 bg-[#174d35] hover:bg-[#1e6143] text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#43b879]/40 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#43b879]" />
                    <span>Complete / Log</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePause(task)}
                      className="p-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white border border-[#24332a]"
                      title={task.active ? 'Pause task' : 'Resume task'}
                    >
                      {task.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#43b879]" />}
                    </button>

                    <button
                      onClick={() => duplicateTask(task.id)}
                      className="p-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white border border-[#24332a]"
                      title="Duplicate task"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onEditTask(task)}
                      className="p-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-white border border-[#24332a]"
                      title="Edit task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => archiveTask(task.id, !task.archived)}
                      className="p-2 rounded-xl bg-[#101311] hover:bg-[#1a231e] text-[#a6aea9] hover:text-[#ef4444] border border-[#24332a]"
                      title={task.archived ? 'Restore task' : 'Archive task'}
                    >
                      {task.archived ? <RotateCcw className="w-3.5 h-3.5 text-[#43b879]" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
