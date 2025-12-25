// ============================================
// 核心类型定义
// ============================================

// 用户相关
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// 订阅相关
export type PlanType = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
}

export interface Quota {
  id: string;
  userId: string;
  planType: PlanType;
  tokensTotal: number;
  tokensUsed: number;
  resetAt: string;
}

// 内容生成相关
export type ContentType = 'tweet' | 'wechat_article' | 'xiaohongshu' | 'linkedin';

export interface GenerateRequest {
  input: string;
  contentType: ContentType;
  templateId?: string;
  model?: string;
  options?: GenerateOptions;
}

export interface GenerateOptions {
  tone?: 'casual' | 'professional' | 'humorous' | 'serious';
  length?: 'short' | 'medium' | 'long';
  includeEmojis?: boolean;
  language?: 'zh' | 'en';
}

export interface GenerateResponse {
  id: string;
  content: string;
  contentType: ContentType;
  modelUsed: string;
  tokensUsed: number;
  remainingQuota: number;
  createdAt: string;
}

export interface GeneratedPost {
  id: string;
  userId: string;
  inputIdea: string;
  outputContent: string;
  contentType: ContentType;
  templateId: string | null;
  modelUsed: string;
  tokensUsed: number;
  status: 'completed' | 'failed';
  createdAt: string;
}

// 模板相关
export interface Template {
  id: string;
  name: string;
  description: string;
  contentType: ContentType;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  options: TemplateOptions;
}

export interface TemplateOptions {
  supportedTones: GenerateOptions['tone'][];
  supportedLengths: GenerateOptions['length'][];
  defaultTone: GenerateOptions['tone'];
  defaultLength: GenerateOptions['length'];
}

// AI 模型相关
export type ModelProvider = 'openai' | 'anthropic' | 'qiwens' | 'wenxin' | 'doubao';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  inputPricePer1M: number;
  outputPricePer1M: number;
  maxTokens: number;
  supportedContentTypes: ContentType[];
  requiresPlan: PlanType[];
}

export interface StreamChunk {
  type: 'token' | 'done' | 'error';
  content?: string;
  delta?: string;
  finishReason?: string;
  error?: string;
}

// API 响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// 套餐相关
export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  currency: 'CNY' | 'USD';
  interval: 'monthly' | 'yearly';
  tokens: number;
  features: string[];
  stripePriceId?: string;
}

// 历史记录
export interface HistoryFilters {
  contentType?: ContentType;
  model?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface HistoryResponse {
  items: GeneratedPost[];
  total: number;
  hasMore: boolean;
}

// 设置相关
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
  defaultModel: string;
  defaultTemplate: string | null;
  notifications: {
    email: boolean;
    marketing: boolean;
  };
}
