import { writable, derived, get } from 'svelte/store';
import type { User, AuthResponse } from '$types';

// ============================================
// Auth Store
// ============================================

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  return {
    subscribe,

    // 初始化：从 localStorage 恢复会话
    init: () => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          update((state) => ({
            ...state,
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          }));
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      update((state) => ({ ...state, isLoading: false }));
    },

    // 登录
    login: async (email: string, password: string) => {
      update((state) => ({ ...state, isLoading: true }));

      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '登录失败');
        }

        const data: AuthResponse = await response.json();

        // 保存到 localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        update((state) => ({
          ...state,
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false
        }));

        return data;
      } catch (error) {
        update((state) => ({ ...state, isLoading: false }));
        throw error;
      }
    },

    // 注册
    register: async (email: string, password: string, name: string) => {
      update((state) => ({ ...state, isLoading: true }));

      try {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '注册失败');
        }

        const data: AuthResponse = await response.json();

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        update((state) => ({
          ...state,
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false
        }));

        return data;
      } catch (error) {
        update((state) => ({ ...state, isLoading: false }));
        throw error;
      }
    },

    // 登出
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    },

    // 更新用户信息
    updateUser: (user: User) => {
      localStorage.setItem('user', JSON.stringify(user));
      update((state) => ({ ...state, user }));
    }
  };
}

export const auth = createAuthStore();

// 派生状态
export const user = derived(auth, ($auth) => $auth.user);
export const token = derived(auth, ($auth) => $auth.token);
export const isAuthenticated = derived(auth, ($auth) => $auth.isAuthenticated);
