import React from 'react';
import { useFamily } from '../context/FamilyContext';
import {
  Home,
  Users,
  CheckSquare,
  Calendar,
  Gift,
  History,
  Settings,
  ShieldCheck,
  Award,
  LogOut,
  Trophy,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAwardModal: () => void;
  onOpenLeaderboardModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAwardModal,
  onOpenLeaderboardModal,
}) => {
  const { admin, settings, pendingApprovals, logout } = useFamily();

  const navItems = [
    { id: 'home', label: 'Home Dashboard', icon: Home },
    { id: 'children', label: 'Children', icon: Users },
    {
      id: 'tasks',
      label: 'Tasks & Chores',
      icon: CheckSquare,
      badge: pendingApprovals.length > 0 ? pendingApprovals.length : undefined,
    },
    { id: 'weekly', label: 'Weekly Points', icon: Calendar },
    { id: 'rewards', label: 'Rewards Store', icon: Gift },
    { id: 'history', label: 'Activity History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden sm:flex flex-col w-64 bg-[#101311] border-r border-[#24332a] h-screen sticky top-0 shrink-0 p-4">
      {/* App Branding */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#174d35] to-[#123122] border border-[#43b879]/30 flex items-center justify-center text-[#43b879] shadow-md shadow-[#174d35]/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-tight">Family Points</div>
          <div className="text-xs text-[#a6aea9] truncate max-w-[140px]">
            {settings.familyName || 'Private Family Space'}
          </div>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#174d35] text-white border border-[#43b879]/40 shadow-sm'
                  : 'text-[#a6aea9] hover:bg-[#151a17] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#43b879]' : 'text-[#a6aea9]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#ef4444] text-white text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Actions in Sidebar */}
      <div className="pt-4 border-t border-[#24332a] space-y-2">
        <button
          onClick={onOpenAwardModal}
          className="w-full py-2.5 px-3 bg-[#174d35] hover:bg-[#1e6143] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-[#43b879]/40 shadow-sm transition-all cursor-pointer"
        >
          <Award className="w-4 h-4 text-[#43b879]" />
          <span>Award Points</span>
        </button>

        {settings.leaderboardEnabled && (
          <button
            onClick={onOpenLeaderboardModal}
            className="w-full py-2 px-3 bg-[#151a17] hover:bg-[#1f2923] text-[#a6aea9] hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 border border-[#24332a] transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-[#fbbf24]" />
            <span>Leaderboard</span>
          </button>
        )}
      </div>

      {/* Admin Profile & Logout */}
      <div className="pt-4 mt-2 border-t border-[#24332a] flex items-center justify-between px-2">
        <div className="min-w-0">
          <div className="text-xs font-bold text-white truncate">{admin?.displayName || 'Mom'}</div>
          <div className="text-[10px] text-[#a6aea9] truncate">{admin?.email}</div>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-lg text-[#a6aea9] hover:text-[#ef4444] hover:bg-[#1a231e] transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
