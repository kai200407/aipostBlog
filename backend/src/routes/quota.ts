// ============================================
// 配额路由
// ============================================

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { getUserQuota } from '../services/quota.js';

const quotaRoutes = new Hono();

// 应用认证中间件
quotaRoutes.use('*', authMiddleware);

/**
 * GET /me
 * 获取当前用户配额
 */
quotaRoutes.get('/me', async (c) => {
  const userId = c.get('userId') as string;

  try {
    const quota = await getUserQuota(userId);

    return c.json({
      success: true,
      data: {
        id: quota.id,
        userId: quota.userId,
        planType: quota.planType,
        tokensTotal: quota.tokensTotal,
        tokensUsed: quota.tokensUsed,
        tokensRemaining: quota.tokensTotal - quota.tokensUsed,
        resetAt: quota.resetAt
      }
    });
  } catch (error) {
    console.error('Get quota error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'GET_QUOTA_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get quota'
        }
      },
      500
    );
  }
});

export default quotaRoutes;
