import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// 环境变量验证
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_BASE: z.string().default('https://api.openai.com/v1'),
  ANTHROPIC_API_KEY: z.string().optional(),
  QIWEN_API_KEY: z.string().optional(),
  WENXIN_API_KEY: z.string().optional(),
  DOUBAO_API_KEY: z.string().optional(),
  ZHIPU_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  CORS_ORIGIN: z.string().default('*')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}

export const config = parsed.data;

// AI 模型配置
export const AI_MODELS = {
  // OpenAI
  'gpt-4o': {
    provider: 'openai',
    name: 'GPT-4o',
    inputPricePer1M: 2.5,
    outputPricePer1M: 10,
    maxTokens: 128000
  },
  'gpt-4o-mini': {
    provider: 'openai',
    name: 'GPT-4o Mini',
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.6,
    maxTokens: 128000
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    name: 'GPT-3.5 Turbo',
    inputPricePer1M: 0.5,
    outputPricePer1M: 1.5,
    maxTokens: 16385
  },

  // Anthropic
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    inputPricePer1M: 3,
    outputPricePer1M: 15,
    maxTokens: 200000
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.25,
    maxTokens: 200000
  },

  // 阿里云
  'qwen-plus': {
    provider: 'qiwens',
    name: '通义千问 Plus',
    inputPricePer1M: 0.4,
    outputPricePer1M: 1.2,
    maxTokens: 30000
  },
  'qwen-turbo': {
    provider: 'qiwens',
    name: '通义千问 Turbo',
    inputPricePer1M: 0.08,
    outputPricePer1M: 0.08,
    maxTokens: 8000
  },

  // 百度
  'wenxin-4': {
    provider: 'wenxin',
    name: '文心一言 4.0',
    inputPricePer1M: 0.12,
    outputPricePer1M: 0.12,
    maxTokens: 128000
  },

  // 智谱AI (ChatGLM)
  'glm-4-flash': {
    provider: 'zhipu',
    name: 'GLM-4 Flash',
    inputPricePer1M: 0,
    outputPricePer1M: 0,
    maxTokens: 128000
  },
  'glm-4-air': {
    provider: 'zhipu',
    name: 'GLM-4 Air',
    inputPricePer1M: 0.5,
    outputPricePer1M: 2,
    maxTokens: 128000
  },
  'glm-4': {
    provider: 'zhipu',
    name: 'GLM-4',
    inputPricePer1M: 10,
    outputPricePer1M: 10,
    maxTokens: 128000
  },
  'glm-4-plus': {
    provider: 'zhipu',
    name: 'GLM-4 Plus',
    inputPricePer1M: 50,
    outputPricePer1M: 50,
    maxTokens: 128000
  },
  'glm-4-long': {
    provider: 'zhipu',
    name: 'GLM-4 Long',
    inputPricePer1M: 0.5,
    outputPricePer1M: 2,
    maxTokens: 1000000
  }
} as const;

// 套餐配置
export const PLANS = {
  free: {
    tokens: 10000,
    features: ['basic_templates', 'history_7days']
  },
  pro: {
    tokens: 200000,
    features: ['all_templates', 'unlimited_history', 'priority_support']
  },
  enterprise: {
    tokens: 1000000,
    features: [
      'all_templates',
      'unlimited_history',
      'priority_support',
      'custom_templates',
      'api_access',
      'team_collaboration'
    ]
  }
} as const;

export type PlanType = keyof typeof PLANS;
export type ModelId = keyof typeof AI_MODELS;
