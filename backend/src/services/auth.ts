// ============================================
// 认证服务 (JWT)
// ============================================

import type { User, JwtPayload, CreateUserInput, LoginInput } from '../types/index.js';
import { db, users } from '../database/index.js';
import { config } from '../config/index.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// JWT 密钥
const JWT_SECRET = new TextEncoder().encode(config.JWT_SECRET);

/**
 * 生成 JWT Token
 */
export async function generateToken(payload: JwtPayload): Promise<string> {
  const token = await new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.JWT_EXPIRES_IN)
    .sign(JWT_SECRET);

  return token;
}

/**
 * 生成 Refresh Token
 */
export async function generateRefreshToken(payload: JwtPayload): Promise<string> {
  const token = await new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.JWT_REFRESH_EXPIRES_IN)
    .sign(JWT_SECRET);

  return token;
}

/**
 * 验证 JWT Token
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string
    };
  } catch {
    return null;
  }
}

/**
 * 从请求中提取用户
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const result = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  return result[0] || null;
}

/**
 * 用户注册
 */
export async function register(input: CreateUserInput): Promise<{ user: User; token: string }> {
  // 检查邮箱是否已存在
  const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (existing.length > 0) {
    throw new Error('Email already exists');
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(input.password, 10);

  // 创建用户
  const result = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name || null
    })
    .returning();

  const user = result[0];

  // 生成 token
  const token = await generateToken({ userId: user.id, email: user.email });

  return { user, token };
}

/**
 * 用户登录
 */
export async function login(input: LoginInput): Promise<{ user: User; token: string }> {
  // 查找用户
  const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const user = result[0];

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // 验证密码
  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // 生成 token
  const token = await generateToken({ userId: user.id, email: user.email });

  return { user, token };
}

/**
 * 更新用户信息
 */
export async function updateUser(
  userId: string,
  data: Partial<Pick<User, 'name' | 'avatarUrl'>>
): Promise<User> {
  const result = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();

  return result[0];
}
