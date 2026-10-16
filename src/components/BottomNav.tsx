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
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { pendingApprovals } = useFamily();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'children', label: 'Children', icon: Users },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: pendingApprovals.length > 0 ? pendingApprovals.length : undefined,
    },
    { id: 'weekly', label: 'Weekly', icon: Calendar },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#101311]/95 backdrop-blur-lg border-t border-[#24332a] pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 min-w-[46px] rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#43b879]'
                  : 'text-[#a6aea9] hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-[#ef4444] text-white text-[9px] font-black flex items-center justify-center px-1 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-[50px] ${isActive ? 'font-bold' : 'font-normal'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#43b879] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
