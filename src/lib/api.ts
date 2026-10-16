import { FamilyState, FamilySettings, Child, Task, Reward, AdminProfile } from '../types';

const TOKEN_KEY = 'family_points_jwt';

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
    // Dispatch auth state change event if needed
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
    return request('/api/auth/status');
  },

  async setupOwner(payload: { email: string; password: string; displayName?: string; familyName?: string }): Promise<{
    token: string;
    admin: AdminProfile;
    settings: FamilySettings;
  }> {
    const res = await request<{ token: string; admin: AdminProfile; settings: FamilySettings }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(payload: { email: string; password: string }): Promise<{
    token: string;
    admin: AdminProfile;
    settings: FamilySettings;
  }> {
    const res = await request<{ token: string; admin: AdminProfile; settings: FamilySettings }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ admin: AdminProfile; settings: FamilySettings }> {
    return request('/api/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updateProfile(displayName: string, email: string): Promise<{ admin: AdminProfile; message: string }> {
    return request('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ displayName, email }),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearStoredToken();
    }
  },

  // Family State
  async getFamilyState(): Promise<FamilyState> {
    return request('/api/family/state');
  },

  // Children
  async addChild(data: Partial<Child>): Promise<{ child: Child; message: string }> {
    return request('/api/family/children', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateChild(id: string, data: Partial<Child>): Promise<{ child: Child; message: string }> {
    return request(`/api/family/children/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async archiveChild(id: string, archive?: boolean): Promise<{ child: Child; message: string }> {
    return request(`/api/family/children/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ archive }),
    });
  },

  // Tasks
  async createTask(data: Partial<Task>): Promise<{ task: Task; message: string }> {
    return request('/api/family/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, data: Partial<Task>): Promise<{ task: Task; message: string }> {
    return request(`/api/family/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async duplicateTask(id: string): Promise<{ task: Task; message: string }> {
    return request(`/api/family/tasks/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async archiveTask(id: string, archive?: boolean): Promise<{ task: Task; message: string }> {
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
    return request(`/api/family/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ childId, date, notes }),
    });
  },

  async approveCompletion(completionId: string): Promise<{ message: string }> {
    return request(`/api/family/completions/${completionId}/approve`, {
      method: 'POST',
    });
  },

  async rejectCompletion(completionId: string, reason?: string): Promise<{ message: string }> {
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
    return request('/api/family/points/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reverseTransaction(transactionId: string, reason?: string): Promise<{ message: string }> {
    return request('/api/family/points/reverse', {
      method: 'POST',
      body: JSON.stringify({ transactionId, reason }),
    });
  },

  // Rewards
  async createReward(data: Partial<Reward>): Promise<{ reward: Reward; message: string }> {
    return request('/api/family/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateReward(id: string, data: Partial<Reward>): Promise<{ reward: Reward; message: string }> {
    return request(`/api/family/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async archiveReward(id: string, archive?: boolean): Promise<{ reward: Reward; message: string }> {
    return request(`/api/family/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ archived: archive }),
    });
  },

  async redeemReward(rewardId: string, childId: string, notes?: string): Promise<{ message: string }> {
    return request(`/api/family/rewards/${rewardId}/redeem`, {
      method: 'POST',
      body: JSON.stringify({ childId, notes }),
    });
  },

  // Settings & Starter data
  async updateSettings(settings: Partial<FamilySettings>): Promise<{ message: string; settings: FamilySettings }> {
    return request('/api/family/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async seedStarterPack(): Promise<{ message: string }> {
    return request('/api/family/seed-starter', {
      method: 'POST',
    });
  },

  async exportBackup(): Promise<any> {
    return request('/api/family/backup/export');
  },

  async importBackup(data: any): Promise<{ message: string }> {
    return request('/api/family/backup/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },
};
