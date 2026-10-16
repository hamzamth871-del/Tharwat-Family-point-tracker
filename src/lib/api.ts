import { FamilyState, FamilySettings, Child, Task, Reward, AdminProfile } from '../types';
import { localDb } from './localDb';

const TOKEN_KEY = 'family_points_jwt';

// Tracking whether the server backend is reachable
let isServerAvailable: boolean | null = null;

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async getStatus(): Promise<{ isSetup: boolean; familyName: string; adminEmail: string | null }> {
    if (isServerAvailable === false) {
      return localDb.getStatus();
    }

    try {
      const res = await request<{ isSetup: boolean; familyName: string; adminEmail: string | null }>('/api/auth/status');
      isServerAvailable = true;
      return res;
    } catch (err: any) {
      // If 404 or network failure (e.g. running on Vercel static hosting without Node backend), fall back to local storage
      console.warn('Backend server not available (404/network). Running in client-side persistence mode:', err.message);
      isServerAvailable = false;
      return localDb.getStatus();
    }
  },

  async setupOwner(payload: { email: string; password: string; displayName?: string; familyName?: string }): Promise<{
    token: string;
    admin: AdminProfile;
    settings: FamilySettings;
  }> {
    if (!isServerAvailable) {
      const res = await localDb.setupOwner(payload);
      setStoredToken(res.token);
      return res;
    }

    try {
      const res = await request<{ token: string; admin: AdminProfile; settings: FamilySettings }>('/api/auth/setup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(res.token);
      return res;
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        isServerAvailable = false;
        const res = await localDb.setupOwner(payload);
        setStoredToken(res.token);
        return res;
      }
      throw err;
    }
  },

  async login(payload: { email: string; password: string }): Promise<{
    token: string;
    admin: AdminProfile;
    settings: FamilySettings;
  }> {
    if (!isServerAvailable) {
      const res = await localDb.login(payload);
      setStoredToken(res.token);
      return res;
    }

    try {
      const res = await request<{ token: string; admin: AdminProfile; settings: FamilySettings }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(res.token);
      return res;
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        isServerAvailable = false;
        const res = await localDb.login(payload);
        setStoredToken(res.token);
        return res;
      }
      throw err;
    }
  },

  async getMe(): Promise<{ admin: AdminProfile; settings: FamilySettings }> {
    if (!isServerAvailable) {
      return localDb.getMe();
    }

    try {
      return await request('/api/auth/me');
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        isServerAvailable = false;
        return localDb.getMe();
      }
      throw err;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    if (!isServerAvailable) {
      return localDb.changePassword(currentPassword, newPassword);
    }
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updateProfile(displayName: string, email: string): Promise<{ admin: AdminProfile; message: string }> {
    if (!isServerAvailable) {
      return localDb.updateProfile(displayName, email);
    }
    return request('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ displayName, email }),
    });
  },

  async logout(): Promise<void> {
    try {
      if (isServerAvailable) {
        await request('/api/auth/logout', { method: 'POST' }).catch(() => {});
      } else {
        await localDb.logout();
      }
    } finally {
      clearStoredToken();
    }
  },

  // Family State
  async getFamilyState(): Promise<FamilyState> {
    if (!isServerAvailable) {
      return localDb.getFamilyState();
    }

    try {
      return await request('/api/family/state');
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        isServerAvailable = false;
        return localDb.getFamilyState();
      }
      throw err;
    }
  },

  // Children
  async addChild(data: Partial<Child>): Promise<{ child: Child; message: string }> {
    if (!isServerAvailable) return localDb.addChild(data);
    return request('/api/family/children', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateChild(id: string, data: Partial<Child>): Promise<{ child: Child; message: string }> {
    if (!isServerAvailable) return localDb.updateChild(id, data);
    return request(`/api/family/children/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async archiveChild(id: string, archive?: boolean): Promise<{ child: Child; message: string }> {
    if (!isServerAvailable) return localDb.archiveChild(id, archive);
    return request(`/api/family/children/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ archive }),
    });
  },

  // Tasks
  async createTask(data: Partial<Task>): Promise<{ task: Task; message: string }> {
    if (!isServerAvailable) return localDb.createTask(data);
    return request('/api/family/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, data: Partial<Task>): Promise<{ task: Task; message: string }> {
    if (!isServerAvailable) return localDb.updateTask(id, data);
    return request(`/api/family/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async duplicateTask(id: string): Promise<{ task: Task; message: string }> {
    if (!isServerAvailable) return localDb.duplicateTask(id);
    return request(`/api/family/tasks/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async archiveTask(id: string, archive?: boolean): Promise<{ task: Task; message: string }> {
    if (!isServerAvailable) return localDb.archiveTask(id, archive);
    return request(`/api/family/tasks/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ archive }),
    });
  },

  // Task Completions & Approvals
  async completeTask(
    taskId: string,
    childId: string,
    date?: string,
    notes?: string
  ): Promise<{ message: string; pointsAwarded: boolean }> {
    if (!isServerAvailable) return localDb.completeTask(taskId, childId, date, notes);
    return request(`/api/family/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ childId, date, notes }),
    });
  },

  async approveCompletion(completionId: string): Promise<{ message: string }> {
    if (!isServerAvailable) return localDb.approveCompletion(completionId);
    return request(`/api/family/completions/${completionId}/approve`, {
      method: 'POST',
    });
  },

  async rejectCompletion(completionId: string, reason?: string): Promise<{ message: string }> {
    if (!isServerAvailable) return localDb.rejectCompletion(completionId, reason);
    return request(`/api/family/completions/${completionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Point Ledger
  async awardPoints(data: {
    childId: string;
    points: number;
    reason: string;
    taskId?: string;
  }): Promise<{ message: string }> {
    if (!isServerAvailable) return localDb.awardPoints(data);
    return request('/api/family/points/award', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adjustPoints(data: {
    childId: string;
    points: number;
    reason: string;
  }): Promise<{ message: string }> {
    if (!isServerAvailable) return localDb.adjustPoints(data);
    return request('/api/family/points/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reverseTransaction(transactionId: string, reason?: string): Promise<{ message: string }> {
    if (!isServerAvailable) return localDb.reverseTransaction(transactionId, reason);
    return request('/api/family/points/reverse', {
      method: 'POST',
      body: JSON.stringify({ transactionId, reason }),
    });
  },

  // Rewards
  async createReward(data: Partial<Reward>): Promise<{ reward: Reward; message: string }> {
    if (!isServerAvailable) return localDb.createReward(data);
    return request('/api/family/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateReward(id: string, data: Partial<Reward>): Promise<{ reward: Reward; message: string }> {
    if (!isServerAvailable) return localDb.updateReward(id, data);
    return request(`/api/family/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async archiveReward(id: string, archive?: boolean): Promise<{ reward: Reward; message: string }> {
    if (!isServerAvailable) return localDb.archiveReward(id, archive);
    return request(`/api/family/rewards/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ archive }),
    });
  },

  async redeemReward(rewardId: string, childId: string, notes?: string): Promise<{ message: string }> {
    if (!isServerAvailable) return localDb.redeemReward(rewardId, childId, notes);
    return request(`/api/family/rewards/${rewardId}/redeem`, {
      method: 'POST',
      body: JSON.stringify({ childId, notes }),
    });
  },

  // Settings & Starter data
  async updateSettings(settings: Partial<FamilySettings>): Promise<{ message: string; settings: FamilySettings }> {
    if (!isServerAvailable) return localDb.updateSettings(settings);
    return request('/api/family/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async seedStarterPack(): Promise<{ message: string }> {
    if (!isServerAvailable) return localDb.seedStarterPack();
    return request('/api/family/seed-starter', {
      method: 'POST',
    });
  },

  async exportBackup(): Promise<any> {
    if (!isServerAvailable) return localDb.exportBackup();
    return request('/api/family/backup/export');
  },

  async importBackup(data: any): Promise<{ message: string }> {
    if (!isServerAvailable) return localDb.importBackup(data);
    return request('/api/family/backup/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },
};
