import { writable, derived } from 'svelte/store';
import type { Quota } from '$types';

// ============================================
// Quota Store
// ============================================

interface QuotaState {
  quota: Quota | null;
  isLoading: boolean;
  error: string | null;
}

function createQuotaStore() {
  const { subscribe, set, update } = writable<QuotaState>({
    quota: null,
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    // 获取配额信息
    fetch: async () => {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/v1/users/me/quota');

        if (!response.ok) {
          throw new Error('获取配额信息失败');
        }

        const quota: Quota = await response.json();

        update((state) => ({
          ...state,
          quota,
          isLoading: false
        }));

        return quota;
      } catch (error) {
        update((state) => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : '未知错误'
        }));
        throw error;
      }
    },

    // 更新配额（生成内容后调用）
    updateUsed: (tokensUsed: number) => {
      update((state) => {
        if (!state.quota) return state;

        return {
          ...state,
          quota: {
            ...state.quota,
            tokensUsed: state.quota.tokensUsed + tokensUsed
          }
        };
      });
    },

    reset: () => {
      set({ quota: null, isLoading: false, error: null });
    }
  };
}

export const quota = createQuotaStore();

// 派生计算
export const remainingTokens = derived(quota, ($quota) => {
  if (!$quota.quota) return 0;
  return $quota.quota.tokensTotal - $quota.quota.tokensUsed;
});

export const usagePercentage = derived(quota, ($quota) => {
  if (!$quota.quota || $quota.quota.tokensTotal === 0) return 0;
  return ($quota.quota.tokensUsed / $quota.quota.tokensTotal) * 100;
});
