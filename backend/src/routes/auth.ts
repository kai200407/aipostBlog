// ============================================
// 认证路由
// ============================================

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { register, login, getUserFromToken } from '../services/auth.js';
import { generateToken } from '../services/auth.js';

const authRoutes = new Hono();

// 注册请求 schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
});

// 登录请求 schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

/**
 * POST /register
 * 用户注册
 */
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const body = c.req.valid('json');

  try {
    const result = await register(body);

    return c.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatarUrl: result.user.avatarUrl,
          emailVerified: result.user.emailVerified,
          createdAt: result.user.createdAt
        },
        token: result.token
      }
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'REGISTER_FAILED',
          message: error instanceof Error ? error.message : 'Registration failed'
        }
      },
      400
    );
  }
});

/**
 * POST /login
 * 用户登录
 */
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const body = c.req.valid('json');

  try {
    const result = await login(body);

    return c.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatarUrl: result.user.avatarUrl,
          emailVerified: result.user.emailVerified,
          createdAt: result.user.createdAt
        },
        token: result.token
      }
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: error instanceof Error ? error.message : 'Login failed'
        }
      },
      401
    );
  }
});

/**
 * POST /logout
 * 用户登出
 */
authRoutes.post('/logout', async (c) => {
  // 在实际应用中，可能需要将 token 加入黑名单
  // 这里我们简单返回成功
  return c.json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});

/**
 * POST /refresh
 * 刷新 Token
 */
authRoutes.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing token' }
      },
      401
    );
  }

  const token = authHeader.slice(7);
  const user = await getUserFromToken(token);

  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
      },
      401
    );
  }

  const newToken = await generateToken({ userId: user.id, email: user.email });

  return c.json({
    success: true,
    data: { token: newToken }
  });
});

export default authRoutes;
