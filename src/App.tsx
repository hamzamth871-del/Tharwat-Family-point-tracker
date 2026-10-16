import React, { useState } from 'react';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ChildrenScreen } from './screens/ChildrenScreen';
import { TasksScreen } from './screens/TasksScreen';
import { WeeklyPointsScreen } from './screens/WeeklyPointsScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';

import { AwardPointsModal } from './components/Modals/AwardPointsModal';
import { ChildModal } from './components/Modals/ChildModal';
import { TaskModal } from './components/Modals/TaskModal';
import { CompleteTaskModal } from './components/Modals/CompleteTaskModal';
import { RewardModal } from './components/Modals/RewardModal';
import { RedeemRewardModal } from './components/Modals/RedeemRewardModal';
import { ChildDetailModal } from './components/Modals/ChildDetailModal';
import { LeaderboardModal } from './components/Modals/LeaderboardModal';
import { ReverseModal } from './components/Modals/ReverseModal';

import { Child, Task, Reward, PointTransaction } from './types';
import { ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { loading, isAuthenticated } = useFamily();

  // Active tab state
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Modal states
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardChildId, setAwardChildId] = useState<string | null>(null);

  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [childToEdit, setChildToEdit] = useState<Child | null>(null);

  const [isChildDetailOpen, setIsChildDetailOpen] = useState(false);
  const [detailedChild, setDetailedChild] = useState<Child | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isCompleteTaskModalOpen, setIsCompleteTaskModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [defaultCompleteChildId, setDefaultCompleteChildId] = useState<string | null>(null);

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardToEdit, setRewardToEdit] = useState<Reward | null>(null);

  const [isRedeemRewardModalOpen, setIsRedeemRewardModalOpen] = useState(false);
  const [rewardToRedeem, setRewardToRedeem] = useState<Reward | null>(null);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [transactionToReverse, setTransactionToReverse] = useState<PointTransaction | null>(null);

  // Loading Splash
  if (loading) {
    return (
      <div className="min-h-screen bg-[#101311] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-[#174d35] border border-[#43b879]/30 flex items-center justify-center text-[#43b879] animate-pulse mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="text-sm font-semibold tracking-wide text-[#a6aea9]">
          Loading Family Points...
        </div>
      </div>
    );
  }

  // Not authenticated: Show Setup / Login
  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <AuthScreen />
      </>
    );
  }

  // Modal triggers
  const handleOpenAwardPoints = (childId?: string) => {
    setAwardChildId(childId || null);
    setIsAwardModalOpen(true);
  };

  const handleOpenAddChild = () => {
    setChildToEdit(null);
    setIsChildModalOpen(true);
  };

  const handleOpenEditChild = (child: Child) => {
    setChildToEdit(child);
    setIsChildModalOpen(true);
  };

  const handleOpenChildDetail = (child: Child) => {
    setDetailedChild(child);
    setIsChildDetailOpen(true);
  };

  const handleOpenCreateTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenCompleteTask = (task: Task, childId?: string) => {
    setTaskToComplete(task);
    setDefaultCompleteChildId(childId || null);
    setIsCompleteTaskModalOpen(true);
  };

  const handleOpenCreateReward = () => {
    setRewardToEdit(null);
    setIsRewardModalOpen(true);
  };

  const handleOpenEditReward = (reward: Reward) => {
    setRewardToEdit(reward);
    setIsRewardModalOpen(true);
  };

  const handleOpenRedeemReward = (reward: Reward) => {
    setRewardToRedeem(reward);
    setIsRedeemRewardModalOpen(true);
  };

  const handleOpenReverseTransaction = (tx: PointTransaction) => {
    setTransactionToReverse(tx);
    setIsReverseModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#101311] text-[#f6f7f6] flex flex-col sm:flex-row">
      <ToastContainer />

      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAwardModal={() => handleOpenAwardPoints()}
        onOpenLeaderboardModal={() => setIsLeaderboardOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 sm:pb-6">
        <Header
          onOpenAwardModal={() => handleOpenAwardPoints()}
          onOpenLeaderboardModal={() => setIsLeaderboardOpen(true)}
          onSelectTab={setCurrentTab}
        />

        <main className="flex-1">
          {currentTab === 'home' && (
            <HomeScreen
              onOpenAddChild={handleOpenAddChild}
              onOpenCreateTask={handleOpenCreateTask}
              onOpenAwardPoints={handleOpenAwardPoints}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              onSelectChild={handleOpenChildDetail}
              onSelectTab={setCurrentTab}
              onQuickCompleteTask={cid => handleOpenAwardPoints(cid)}
            />
          )}

          {currentTab === 'children' && (
            <ChildrenScreen
              onOpenAddChild={handleOpenAddChild}
              onEditChild={handleOpenEditChild}
              onSelectChild={handleOpenChildDetail}
              onOpenAwardPoints={handleOpenAwardPoints}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksScreen
              onOpenCreateTask={handleOpenCreateTask}
              onEditTask={handleOpenEditTask}
              onCompleteTask={handleOpenCompleteTask}
            />
          )}

          {currentTab === 'weekly' && (
            <WeeklyPointsScreen
              onOpenAwardPoints={handleOpenAwardPoints}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'rewards' && (
            <RewardsScreen
              onOpenCreateReward={handleOpenCreateReward}
              onEditReward={handleOpenEditReward}
              onRedeemReward={handleOpenRedeemReward}
            />
          )}

          {currentTab === 'history' && (
            <HistoryScreen onReverseTransaction={handleOpenReverseTransaction} />
          )}

          {currentTab === 'settings' && <SettingsScreen />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Modals */}
      <AwardPointsModal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        preselectedChildId={awardChildId}
      />

      <ChildModal
        isOpen={isChildModalOpen}
        onClose={() => setIsChildModalOpen(false)}
        childToEdit={childToEdit}
      />

      <ChildDetailModal
        isOpen={isChildDetailOpen}
        onClose={() => setIsChildDetailOpen(false)}
        child={detailedChild}
        onEditChild={child => {
          setIsChildDetailOpen(false);
          handleOpenEditChild(child);
        }}
        onAwardPoints={childId => {
          setIsChildDetailOpen(false);
          handleOpenAwardPoints(childId);
        }}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />

      <CompleteTaskModal
        isOpen={isCompleteTaskModalOpen}
        onClose={() => setIsCompleteTaskModalOpen(false)}
        task={taskToComplete}
        defaultChildId={defaultCompleteChildId}
      />

      <RewardModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        rewardToEdit={rewardToEdit}
      />

      <RedeemRewardModal
        isOpen={isRedeemRewardModalOpen}
        onClose={() => setIsRedeemRewardModalOpen(false)}
        reward={rewardToRedeem}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <ReverseModal
        isOpen={isReverseModalOpen}
        onClose={() => setIsReverseModalOpen(false)}
        transaction={transactionToReverse}
      />
    </div>
  );
};

export default function App() {
  return (
    <FamilyProvider>
      <MainLayout />
    </FamilyProvider>
  );
}
