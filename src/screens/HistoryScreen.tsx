import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { PointTransaction } from '../types';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  Award,
  CheckCircle2,
  Gift,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';

interface HistoryScreenProps {
  onReverseTransaction: (tx: PointTransaction) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onReverseTransaction }) => {
  const { pointTransactions, children, auditLogs } = useFamily();

  const [activeTab, setActiveTab] = useState<'points' | 'audit'>('points');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const activeChildren = children.filter(c => !c.archived);

  // Filter point transactions
  const filteredTransactions = pointTransactions.filter(tx => {
    if (selectedChildId !== 'all' && tx.childId !== selectedChildId) return false;
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const child = children.find(c => c.id === tx.childId);
      const childName = child ? child.name.toLowerCase() : '';
      const matchReason = tx.reason.toLowerCase().includes(q);
      const matchChild = childName.includes(q);
      if (!matchReason && !matchChild) return false;
    }

    return true;
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (selectedChildId !== 'all' && log.childId !== selectedChildId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchDetails && !matchAction) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#43b879]" />
            <span>Activity History & Audit Ledger</span>
          </h1>
          <p className="text-xs text-[#a6aea9]">
            Full permanent record of points awarded, tasks approved, rewards, and corrections
          </p>
        </div>

        {/* View toggle (Points ledger vs System audit) */}
        <div className="flex items-center bg-[#151a17] border border-[#24332a] rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('points')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'points'
                ? 'bg-[#174d35] text-white shadow-sm'
                : 'text-[#a6aea9] hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Points Ledger ({pointTransactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-[#174d35] text-white shadow-sm'
                : 'text-[#a6aea9] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#a6aea9] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by reason, chore, or notes..."
              className="w-full bg-[#101311] border border-[#24332a] rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#43b879]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Child Filter */}
            <select
              value={selectedChildId}
              onChange={e => setSelectedChildId(e.target.value)}
              className="flex-1 sm:flex-none bg-[#101311] border border-[#24332a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#43b879]"
            >
              <option value="all">All Children</option>
              {activeChildren.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Transaction Type Filter (only for points tab) */}
            {activeTab === 'points' && (
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-[#101311] border border-[#24332a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#43b879]"
              >
                <option value="all">All Types</option>
                <option value="task_completion">Task Completions</option>
                <option value="manual_award">Manual Awards</option>
                <option value="reward_redemption">Rewards</option>
                <option value="correction">Corrections</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Table / List */}
      {activeTab === 'points' ? (
        filteredTransactions.length === 0 ? (
          <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-8 text-center text-xs text-[#a6aea9]">
            No point transactions found matching the filter criteria.
          </div>
        ) : (
          <div className="bg-[#151a17] border border-[#24332a] rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-[#24332a]">
              {filteredTransactions.map(tx => {
                const child = children.find(c => c.id === tx.childId);
                const isPositive = tx.points > 0;
                const dateObj = new Date(tx.timestamp);

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1a231e] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        style={{ backgroundColor: child ? `${child.color}20` : '#174d35' }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-[#24332a] shrink-0 mt-0.5"
                      >
                        {child?.avatar || '🌟'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {child?.name || 'Child'}
                          </span>
                          <span className="text-[10px] text-[#a6aea9] bg-[#101311] px-1.5 py-0.2 rounded border border-[#24332a] capitalize">
                            {tx.type.replace('_', ' ')}
                          </span>
                          {tx.referenceTransactionId && (
                            <span className="text-[10px] text-[#fbbf24] bg-[#2a2212] px-1.5 py-0.2 rounded border border-[#fbbf24]/30 font-semibold">
                              Reversal / Offset
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-white mt-0.5 truncate">
                          {tx.reason}
                        </div>
                        <div className="text-[11px] text-[#a6aea9] mt-0.5">
                          {dateObj.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          at{' '}
                          {dateObj.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#24332a]">
                      <span
                        className={`text-lg font-black ${
                          isPositive ? 'text-[#43b879]' : 'text-[#ef4444]'
                        }`}
                      >
                        {isPositive ? `+${tx.points}` : tx.points} pts
                      </span>

                      {!tx.referenceTransactionId && tx.type !== 'reward_redemption' && (
                        <button
                          onClick={() => onReverseTransaction(tx)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#101311] hover:bg-[#3d1818] text-[#a6aea9] hover:text-[#ef4444] border border-[#24332a] text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Undo this transaction with an offsetting correction"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* Audit Trail Tab */
        filteredAuditLogs.length === 0 ? (
          <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-8 text-center text-xs text-[#a6aea9]">
            No audit logs found.
          </div>
        ) : (
          <div className="bg-[#151a17] border border-[#24332a] rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-[#24332a]">
              {filteredAuditLogs.map(log => {
                const child = children.find(c => c.id === log.childId);
                return (
                  <div key={log.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.action}</span>
                        {child && (
                          <span className="text-[10px] text-[#43b879] bg-[#174d35]/30 px-1.5 py-0.2 rounded border border-[#43b879]/30">
                            {child.name}
                          </span>
                        )}
                      </div>
                      <div className="text-[#d1d5db] mt-0.5">{log.details}</div>
                    </div>
                    <div className="text-[10px] text-[#a6aea9] shrink-0 text-right">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};
