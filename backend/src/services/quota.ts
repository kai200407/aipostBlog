// ============================================
// 配额管理服务
// ============================================

import type { Quota, PlanType } from '../types/index.js';
import { db, quotas, users } from '../database/index.js';
import { PLANS } from '../config/index.js';
import { eq, and } from 'drizzle-orm';
import { startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';

/**
 * 获取用户当前配额
 */
export async function getUserQuota(userId: string): Promise<Quota> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // 查找当月配额记录
  const result = await db
    .select()
    .from(quotas)
    .where(
      and(
        eq(quotas.userId, userId),
        eq(quotas.planType, 'free'), // TODO: 从订阅获取
        eq(quotas.resetAt, monthEnd)
      )
    )
    .limit(1);

  // 如果不存在，创建新配额
  if (result.length === 0) {
    return await createQuota(userId, 'free'); // TODO: 从订阅获取
  }

  return result[0];
}

/**
 * 创建用户配额
 */
export async function createQuota(userId: string, planType: PlanType): Promise<Quota> {
  const now = new Date();
  const monthEnd = endOfMonth(now);

  const planConfig = PLANS[planType];

  const result = await db
    .insert(quotas)
    .values({
      userId,
      planType,
      tokensTotal: planConfig.tokens,
      tokensUsed: 0,
      resetAt: monthEnd
    })
    .returning();

  return result[0];
}

/**
 * 检查配额是否足够
 */
export async function checkQuota(userId: string, estimatedTokens: number): Promise<boolean> {
  const quota = await getUserQuota(userId);
  const remaining = quota.tokensTotal - quota.tokensUsed;
  return remaining >= estimatedTokens;
}

/**
 * 扣除配额
 */
export async function deductQuota(userId: string, tokens: number): Promise<Quota> {
  const quota = await getUserQuota(userId);

  const result = await db
    .update(quotas)
    .set({
      tokensUsed: quota.tokensUsed + tokens
    })
    .where(eq(quotas.id, quota.id))
    .returning();

  return result[0];
}

/**
 * 重置过期配额（定时任务）
 */
export async function resetExpiredQuotas(): Promise<void> {
  const now = new Date();

  const expired = await db
    .select()
    .from(quotas)
    .where(eq(quotas.resetAt, now)); // resetAt 已经过期的配额

  for (const quota of expired) {
    await db
      .update(quotas)
      .set({
        tokensUsed: 0,
        resetAt: endOfMonth(now)
      })
      .where(eq(quotas.id, quota.id));
  }
}
