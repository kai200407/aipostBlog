// ============================================
// 数据库 Schema 定义 (Drizzle ORM)
// ============================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  pgEnum,
  jsonb
} from 'drizzle-orm/pg-core';

// Enums
export const planTypeEnum = pgEnum('plan_type', ['free', 'pro', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'cancelled',
  'expired',
  'pending'
]);
export const contentTypeEnum = pgEnum('content_type', [
  'tweet',
  'wechat_article',
  'xiaohongshu',
  'linkedin'
]);

// Users 表
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Subscriptions 表
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planType: planTypeEnum('plan_type').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  cancelledAt: timestamp('cancelled_at'),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Quotas 表
export const quotas = pgTable('quotas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planType: planTypeEnum('plan_type').notNull(),
  tokensTotal: integer('tokens_total').notNull(),
  tokensUsed: integer('tokens_used').notNull().default(0),
  resetAt: timestamp('reset_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// GeneratedPosts 表
export const generatedPosts = pgTable('generated_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  inputIdea: text('input_idea').notNull(),
  outputContent: text('output_content').notNull(),
  contentType: contentTypeEnum('content_type').notNull(),
  templateId: varchar('template_id', { length: 50 }),
  modelUsed: varchar('model_used', { length: 50 }).notNull(),
  tokensUsed: integer('tokens_used').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('completed'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// UsageLogs 表
export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokensUsed: integer('tokens_used').notNull(),
  modelUsed: varchar('model_used', { length: 50 }).notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Quota = typeof quotas.$inferSelect;
export type NewQuota = typeof quotas.$inferInsert;
export type GeneratedPost = typeof generatedPosts.$inferSelect;
export type NewGeneratedPost = typeof generatedPosts.$inferInsert;
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
