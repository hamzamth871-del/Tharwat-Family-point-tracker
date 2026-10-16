import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { api } from '../lib/api';
import {
  Settings,
  ShieldCheck,
  Lock,
  Download,
  Upload,
  FileSpreadsheet,
  LogOut,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    admin,
    settings,
    updateSettings,
    changePassword,
    updateProfile,
    logout,
    showToast,
    refreshData,
    pointTransactions,
    children,
  } = useFamily();

  // Settings form states
  const [familyName, setFamilyName] = useState(settings.familyName);
  const [weekStartDay, setWeekStartDay] = useState<0 | 1>(settings.weekStartDay);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [defaultWeeklyGoal, setDefaultWeeklyGoal] = useState(settings.defaultWeeklyGoal);
  const [allowNegativePoints, setAllowNegativePoints] = useState(settings.allowNegativePoints);
  const [defaultRequireApproval, setDefaultRequireApproval] = useState(settings.defaultRequireApproval);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(settings.leaderboardEnabled);
  const [rewardsEnabled, setRewardsEnabled] = useState(settings.rewardsEnabled);
  const [rewardsDeductPoints, setRewardsDeductPoints] = useState(settings.rewardsDeductPoints);

  // Admin Profile
  const [displayName, setDisplayName] = useState(admin?.displayName || 'Mom');
  const [email, setEmail] = useState(admin?.email || '');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Save general settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        familyName,
        weekStartDay,
        timezone,
        defaultWeeklyGoal: Number(defaultWeeklyGoal),
        allowNegativePoints,
        defaultRequireApproval,
        leaderboardEnabled,
        rewardsEnabled,
        rewardsDeductPoints,
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(displayName, email);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    }
  };

  // Export JSON backup
  const handleExportBackup = async () => {
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family_points_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup JSON downloaded successfully!');
    } catch (err: any) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        await api.importBackup(parsed);
        await refreshData();
        showToast('Backup restored successfully!');
      } catch (err: any) {
        showToast('Restore failed: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Export CSV Report of points
  const handleExportCSV = () => {
    try {
      const rows = [
        ['Date', 'Time', 'Child', 'Type', 'Points', 'Reason', 'Transaction ID'],
      ];

      pointTransactions.forEach(tx => {
        const child = children.find(c => c.id === tx.childId);
        const dt = new Date(tx.timestamp);
        rows.push([
          dt.toLocaleDateString(),
          dt.toLocaleTimeString(),
          child ? child.name : 'Unknown',
          tx.type,
          String(tx.points),
          `"${(tx.reason || '').replace(/"/g, '""')}"`,
          tx.id,
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `family_points_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV report downloaded!');
    } catch (err: any) {
      showToast('CSV generation failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#43b879]" />
          <span>Application Settings</span>
        </h1>
        <p className="text-xs text-[#a6aea9]">
          Manage family configurations, administrator credentials, and data backups
        </p>
      </div>

      {/* General Family Preferences */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#43b879]" />
          <span>Family & Weekly Preferences</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Family Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                placeholder="Our Family"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Default Weekly Target (pts)
              </label>
              <input
                type="number"
                min={10}
                max={1000}
                value={defaultWeeklyGoal}
                onChange={e => setDefaultWeeklyGoal(parseInt(e.target.value, 10) || 50)}
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Week Starts On
              </label>
              <select
                value={weekStartDay}
                onChange={e => setWeekStartDay(Number(e.target.value) as 0 | 1)}
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              >
                <option value={1}>Monday (Recommended)</option>
                <option value={0}>Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Family Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                placeholder="e.g. America/New_York or UTC"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="bg-[#101311] border border-[#24332a] rounded-xl p-4 space-y-3 mt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Enable Leaderboard</div>
                <div className="text-[11px] text-[#a6aea9]">
                  Shows positive weekly rank comparisons for active children
                </div>
              </div>
              <input
                type="checkbox"
                checked={leaderboardEnabled}
                onChange={e => setLeaderboardEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#43b879] rounded cursor-pointer"
              />
            </label>

            <div className="border-t border-[#24332a] pt-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">Allow Negative Point Adjustments</div>
                  <div className="text-[11px] text-[#a6aea9]">
                    Allows subtracting points with mandatory justification
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowNegativePoints}
                  onChange={e => setAllowNegativePoints(e.target.checked)}
                  className="w-4 h-4 accent-[#43b879] rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="border-t border-[#24332a] pt-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">Require Mom's Approval by Default</div>
                  <div className="text-[11px] text-[#a6aea9]">
                    New tasks default to pending until approved by Mom
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={defaultRequireApproval}
                  onChange={e => setDefaultRequireApproval(e.target.checked)}
                  className="w-4 h-4 accent-[#43b879] rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="border-t border-[#24332a] pt-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">Rewards Deduct Points</div>
                  <div className="text-[11px] text-[#a6aea9]">
                    When checked, redeeming rewards subtracts points from the child's balance
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={rewardsDeductPoints}
                  onChange={e => setRewardsDeductPoints(e.target.checked)}
                  className="w-4 h-4 accent-[#43b879] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#174d35] hover:bg-[#1e6143] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border border-[#43b879]/40 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#43b879]" />
            <span>Save Family Preferences</span>
          </button>
        </form>
      </div>

      {/* Administrator Profile */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#43b879]" />
          <span>Administrator Profile</span>
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Login Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#101311] hover:bg-[#1a231e] text-white py-2 px-4 rounded-xl text-xs font-semibold border border-[#24332a] transition-colors"
          >
            Update Profile Name & Email
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#43b879]" />
          <span>Security & Password Management</span>
        </h2>

        {passwordError && (
          <div className="mb-4 bg-[#291717] border border-[#6b2c2c] rounded-xl p-3 text-xs text-[#fca5a5] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-4 bg-[#15231c] border border-[#2f5e41] rounded-xl p-3 text-xs text-[#43b879] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#101311] border border-[#24332a] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#43b879]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#101311] hover:bg-[#1a231e] text-white py-2 px-4 rounded-xl text-xs font-semibold border border-[#24332a] transition-colors"
          >
            Update Admin Password
          </button>
        </form>
      </div>

      {/* Data Backup & Export Section */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Download className="w-4 h-4 text-[#43b879]" />
          <span>Data Backup & Reports</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-3 bg-[#101311] hover:bg-[#1a231e] border border-[#24332a] rounded-xl text-left transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#43b879] mb-1.5" />
            <div className="text-xs font-bold text-white">Export Full JSON</div>
            <div className="text-[10px] text-[#a6aea9]">Download family database backup</div>
          </button>

          <label className="p-3 bg-[#101311] hover:bg-[#1a231e] border border-[#24332a] rounded-xl text-left transition-colors cursor-pointer block">
            <Upload className="w-4 h-4 text-[#38bdf8] mb-1.5" />
            <div className="text-xs font-bold text-white">Restore from JSON</div>
            <div className="text-[10px] text-[#a6aea9]">Upload previous backup file</div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-3 bg-[#101311] hover:bg-[#1a231e] border border-[#24332a] rounded-xl text-left transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#fbbf24] mb-1.5" />
            <div className="text-xs font-bold text-white">Export Points CSV</div>
            <div className="text-[10px] text-[#a6aea9]">Spreadsheet report of all entries</div>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">Log Out</div>
          <div className="text-[11px] text-[#a6aea9]">
            Securely ends your session on this device
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-[#291717] hover:bg-[#3d1818] text-[#fca5a5] border border-[#ef4444]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#ef4444]" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
