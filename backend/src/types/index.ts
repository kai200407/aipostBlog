// ============================================
// 核心类型定义
// ============================================

// 用户相关
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// 订阅相关
export type PlanType = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

export interface Quota {
  id: string;
  userId: string;
  planType: PlanType;
  tokensTotal: number;
  tokensUsed: number;
  resetAt: Date;
  createdAt: Date;
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
  createdAt: Date;
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
  createdAt: Date;
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

// AI 相关
export type ModelProvider = 'openai' | 'anthropic' | 'qiwens' | 'wenxin' | 'doubao';

export interface AIProvider {
  name: string;
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
  stream?(request: AIGenerateRequest): AsyncIterable<AIStreamChunk>;
}

export interface AIGenerateRequest {
  prompt: string;
  systemPrompt?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface AIGenerateResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  finishReason: 'stop' | 'length' | 'error';
}

export interface AIStreamChunk {
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

// 使用日志
export interface UsageLog {
  id: string;
  userId: string;
  tokensUsed: number;
  modelUsed: string;
  actionType: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
