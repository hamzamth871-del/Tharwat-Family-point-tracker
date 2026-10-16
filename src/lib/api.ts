import { FamilyState, FamilySettings, Child, Task, Reward, AdminProfile } from '../types';
import { localDb } from './localDb';

const TOKEN_KEY = 'family_points_jwt';

// Tracking whether the server backend is reachable
let isServerAvailable: boolean | null = null;

export function getStoredToken(): string | null {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setStoredToken(token: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredToken() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function checkServerAvailability(): Promise<boolean> {
  if (isServerAvailable !== null) {
    return isServerAvailable;
  }

  try {
    const res = await fetch('/api/auth/status', {
      headers: { Accept: 'application/json' },
    });

    const contentType = res.headers.get('content-type') || '';

    // Must be 200 OK and content-type must be JSON (NOT HTML fallback like Vercel rewrites)
    if (!res.ok || !contentType.includes('application/json')) {
      console.info('Running in client-side persistence mode (static deployment / Vercel)');
      isServerAvailable = false;
      return false;
    }

    const data = await res.json();
    if (typeof data !== 'object' || typeof data.isSetup !== 'boolean') {
      console.info('Non-standard API response. Running in client-side persistence mode.');
      isServerAvailable = false;
      return false;
    }

    isServerAvailable = true;
    return true;
  } catch {
    console.info('Backend unreachable. Running in client-side persistence mode.');
    isServerAvailable = false;
    return false;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

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

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    isServerAvailable = false;
    throw new Error('API server returned non-JSON response. Switching to offline mode.');
  }

  if (response.status === 401) {
    clearStoredToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 404 || response.status === 405) {
      isServerAvailable = false;
      throw new Error('SERVER_NOT_FOUND');
    }
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async getStatus(): Promise<{ isSetup: boolean; familyName: string; adminEmail: string | null }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) {
      return localDb.getStatus();
    }

    try {
      return await request('/api/auth/status');
    } catch {
      isServerAvailable = false;
      return localDb.getStatus();
    }
  },

  async setupOwner(payload: { email: string; password: string; displayName?: string; familyName?: string }): Promise<{
    token: string;
    admin: AdminProfile;
    settings: FamilySettings;
  }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) {
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
      if (err.message?.includes('SERVER_NOT_FOUND') || err.message?.includes('non-JSON') || !isServerAvailable) {
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
    const hasServer = await checkServerAvailability();
    if (!hasServer) {
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
      if (err.message?.includes('SERVER_NOT_FOUND') || err.message?.includes('non-JSON') || !isServerAvailable) {
        isServerAvailable = false;
        const res = await localDb.login(payload);
        setStoredToken(res.token);
        return res;
      }
      throw err;
    }
  },

  async getMe(): Promise<{ admin: AdminProfile; settings: FamilySettings }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) {
      return localDb.getMe();
    }

    try {
      return await request('/api/auth/me');
    } catch (err: any) {
      if (err.message?.includes('SERVER_NOT_FOUND') || err.message?.includes('non-JSON') || !isServerAvailable) {
        isServerAvailable = false;
        return localDb.getMe();
      }
      throw err;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) {
      return localDb.changePassword(currentPassword, newPassword);
    }
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updateProfile(displayName: string, email: string): Promise<{ admin: AdminProfile; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) {
      return localDb.updateProfile(displayName, email);
    }
    return request('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ displayName, email }),
    });
  },

  async logout(): Promise<void> {
    const hasServer = await checkServerAvailability();
    try {
      if (hasServer) {
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
    const hasServer = await checkServerAvailability();
    if (!hasServer) {
      return localDb.getFamilyState();
    }

    try {
      return await request('/api/family/state');
    } catch (err: any) {
      if (err.message?.includes('SERVER_NOT_FOUND') || err.message?.includes('non-JSON') || !isServerAvailable) {
        isServerAvailable = false;
        return localDb.getFamilyState();
      }
      throw err;
    }
  },

  // Children
  async addChild(data: Partial<Child>): Promise<{ child: Child; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.addChild(data);
    return request('/api/family/children', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateChild(id: string, data: Partial<Child>): Promise<{ child: Child; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.updateChild(id, data);
    return request(`/api/family/children/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async archiveChild(id: string, archive?: boolean): Promise<{ child: Child; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.archiveChild(id, archive);
    return request(`/api/family/children/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ archive }),
    });
  },

  // Tasks
  async createTask(data: Partial<Task>): Promise<{ task: Task; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.createTask(data);
    return request('/api/family/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, data: Partial<Task>): Promise<{ task: Task; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.updateTask(id, data);
    return request(`/api/family/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async duplicateTask(id: string): Promise<{ task: Task; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.duplicateTask(id);
    return request(`/api/family/tasks/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async archiveTask(id: string, archive?: boolean): Promise<{ task: Task; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.archiveTask(id, archive);
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
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.completeTask(taskId, childId, date, notes);
    return request(`/api/family/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ childId, date, notes }),
    });
  },

  async approveCompletion(completionId: string): Promise<{ message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.approveCompletion(completionId);
    return request(`/api/family/completions/${completionId}/approve`, {
      method: 'POST',
    });
  },

  async rejectCompletion(completionId: string, reason?: string): Promise<{ message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.rejectCompletion(completionId, reason);
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
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.awardPoints(data);
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
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.adjustPoints(data);
    return request('/api/family/points/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reverseTransaction(transactionId: string, reason?: string): Promise<{ message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.reverseTransaction(transactionId, reason);
    return request('/api/family/points/reverse', {
      method: 'POST',
      body: JSON.stringify({ transactionId, reason }),
    });
  },

  // Rewards
  async createReward(data: Partial<Reward>): Promise<{ reward: Reward; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.createReward(data);
    return request('/api/family/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateReward(id: string, data: Partial<Reward>): Promise<{ reward: Reward; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.updateReward(id, data);
    return request(`/api/family/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async archiveReward(id: string, archive?: boolean): Promise<{ reward: Reward; message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.archiveReward(id, archive);
    return request(`/api/family/rewards/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ archive }),
    });
  },

  async redeemReward(rewardId: string, childId: string, notes?: string): Promise<{ message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.redeemReward(rewardId, childId, notes);
    return request(`/api/family/rewards/${rewardId}/redeem`, {
      method: 'POST',
      body: JSON.stringify({ childId, notes }),
    });
  },

  // Settings & Starter data
  async updateSettings(settings: Partial<FamilySettings>): Promise<{ message: string; settings: FamilySettings }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.updateSettings(settings);
    return request('/api/family/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async seedStarterPack(): Promise<{ message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.seedStarterPack();
    return request('/api/family/seed-starter', {
      method: 'POST',
    });
  },

  async exportBackup(): Promise<any> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.exportBackup();
    return request('/api/family/backup/export');
  },

  async importBackup(data: any): Promise<{ message: string }> {
    const hasServer = await checkServerAvailability();
    if (!hasServer) return localDb.importBackup(data);
    return request('/api/family/backup/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },
};
