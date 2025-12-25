// ============================================
// 用户路由
// ============================================

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { updateUser } from '../services/auth.js';
import { getUserQuota } from '../services/quota.js';

const userRoutes = new Hono();

// 应用认证中间件
userRoutes.use('*', authMiddleware);

// 更新用户 schema
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional()
});

/**
 * GET /me
 * 获取当前用户信息
 */
userRoutes.get('/me', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    }
  });
});

/**
 * PUT /me
 * 更新用户信息
 */
userRoutes.put('/me', zValidator('json', updateSchema), async (c) => {
  const userId = c.get('userId') as string;
  const body = c.req.valid('json');

  try {
    const user = await updateUser(userId, body);

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update user'
        }
      },
      500
    );
  }
});

/**
 * GET /me/quota
 * 获取当前用户配额信息
 */
userRoutes.get('/me/quota', async (c) => {
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
        usagePercentage: (quota.tokensUsed / quota.tokensTotal) * 100,
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

export default userRoutes;
