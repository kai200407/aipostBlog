// ============================================
// 认证中间件
// ============================================

import type { Context, Next } from 'hono';
import { getUserFromToken } from '../services/auth.js';

/**
 * JWT 认证中间件
 */
export async function authMiddleware(c: Context, next: Next) {
  // 从 header 获取 token
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header'
        }
      },
      401
    );
  }

  const token = authHeader.slice(7);

  // 验证 token 并获取用户
  const user = await getUserFromToken(token);
  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        }
      },
      401
    );
  }

  // 将用户信息存入 context
  c.set('user', user);
  c.set('userId', user.id);

  await next();
}

/**
 * 可选的认证中间件（不强制要求登录）
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = await getUserFromToken(token);
    if (user) {
      c.set('user', user);
      c.set('userId', user.id);
    }
  }

  await next();
}
