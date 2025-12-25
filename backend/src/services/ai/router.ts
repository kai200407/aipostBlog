// ============================================
// AI 路由服务
// ============================================

import type { ContentType, PlanType } from '../../types/index.js';
import { AI_MODELS, PLANS } from '../../config/index.js';
import { createProvider, getProviderForModel } from './providers.js';
import {
  getDefaultTemplate,
  getTemplate,
  getTemplatesByContentType
} from './templates.js';

export interface GenerateOptions {
  tone?: 'casual' | 'professional' | 'humorous' | 'serious';
  length?: 'short' | 'medium' | 'long';
  includeEmojis?: boolean;
  language?: 'zh' | 'en';
}

export interface AIRouterConfig {
  userPlan: PlanType;
  contentType: ContentType;
  preferredModel?: string;
  options?: GenerateOptions;
}

/**
 * AI 路由器：根据用户套餐和内容类型选择最优模型
 */
export class AIRouter {
  /**
   * 选择最适合的模型
   */
  selectModel(config: AIRouterConfig): string {
    const { userPlan, contentType, preferredModel } = config;

    // 如果用户指定了模型，检查是否可用
    if (preferredModel && AI_MODELS[preferredModel]) {
      return preferredModel;
    }

    // 根据套餐和内容类型选择默认模型
    const modelMatrix: Record<PlanType, Record<ContentType, string>> = {
      free: {
        tweet: 'glm-4-flash', // 使用智谱免费模型
        wechat_article: 'glm-4-flash',
        xiaohongshu: 'glm-4-flash',
        linkedin: 'glm-4-flash'
      },
      pro: {
        tweet: 'glm-4-air', // 智谱高性价比模型
        wechat_article: 'glm-4',
        xiaohongshu: 'glm-4-air',
        linkedin: 'glm-4'
      },
      enterprise: {
        tweet: 'glm-4-plus',
        wechat_article: 'glm-4-plus',
        xiaohongshu: 'glm-4',
        linkedin: 'glm-4-plus'
      }
    };

    return modelMatrix[userPlan]?.[contentType] || 'glm-4-flash';
  }

  /**
   * 估算 token 成本
   */
  estimateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * modelConfig.inputPricePer1M;
    const outputCost = (outputTokens / 1_000_000) * modelConfig.outputPricePer1M;

    return inputCost + outputCost;
  }

  /**
   * 检查用户配额是否足够
   */
  checkQuota(userPlan: PlanType, usedTokens: number, estimatedTokens: number): boolean {
    const planConfig = PLANS[userPlan];
    return usedTokens + estimatedTokens <= planConfig.tokens;
  }

  /**
   * 失败重试与降级
   */
  async generateWithRetry(
    request: {
      input: string;
      contentType: ContentType;
      templateId?: string;
      options?: GenerateOptions;
    },
    userPlan: PlanType,
    maxRetries = 2
  ): Promise<{
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    attempts: string[];
  }> {
    // 获取模板
    const template = request.templateId
      ? getTemplate(request.templateId)
      : getDefaultTemplate(request.contentType);

    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    // 构建提示词
    const systemPrompt = template.systemPrompt;
    const userPrompt = template.userPromptTemplate(
      request.input,
      request.options || {}
    );

    // 确定模型降级顺序
    const selectedModel = this.selectModel({
      userPlan,
      contentType: request.contentType
    });

    const fallbackChain = this.buildFallbackChain(selectedModel, userPlan);

    const attempts: string[] = [];

    for (const model of fallbackChain) {
      attempts.push(model);

      try {
        const providerName = getProviderForModel(model);
        const provider = createProvider(providerName);

        const response = await provider.generate({
          prompt: userPrompt,
          systemPrompt,
          model,
          temperature: 0.7,
          maxTokens: 2000
        });

        return {
          content: response.content,
          model: response.model,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          attempts
        };
      } catch (error) {
        console.error(`Model ${model} failed:`, error);

        // 最后一个模型也失败了，抛出错误
        if (fallbackChain.indexOf(model) === fallbackChain.length - 1) {
          throw new Error(
            `All models failed. Attempts: ${attempts.join(', ')}. Last error: ${error}`
          );
        }

        // 继续尝试下一个模型
        continue;
      }
    }

    throw new Error('No models available');
  }

  /**
   * 构建降级模型链
   */
  private buildFallbackChain(primaryModel: string, userPlan: PlanType): string[] {
    // 根据主模型构建降级链
    const fallbackMap: Record<string, string[]> = {
      // OpenAI 降级链
      'gpt-4o': ['gpt-4o-mini', 'glm-4', 'glm-4-air', 'glm-4-flash'],
      'gpt-4o-mini': ['glm-4-air', 'glm-4-flash', 'qwen-plus', 'qwen-turbo'],
      'gpt-3.5-turbo': ['glm-4-air', 'glm-4-flash', 'qwen-turbo'],
      // Anthropic 降级链
      'claude-3-5-sonnet': ['claude-3-haiku', 'glm-4', 'glm-4-air', 'glm-4-flash'],
      'claude-3-haiku': ['glm-4-air', 'glm-4-flash', 'qwen-plus', 'qwen-turbo'],
      // 阿里云 降级链
      'qwen-plus': ['qwen-turbo', 'glm-4-flash'],
      'qwen-turbo': ['glm-4-flash'],
      // 智谱AI 降级链
      'glm-4-plus': ['glm-4', 'glm-4-air', 'glm-4-flash'],
      'glm-4': ['glm-4-air', 'glm-4-flash'],
      'glm-4-air': ['glm-4-flash', 'qwen-turbo'],
      'glm-4-flash': ['qwen-turbo'],
      'glm-4-long': ['glm-4', 'glm-4-air', 'glm-4-flash']
    };

    const fallbacks = fallbackMap[primaryModel] || ['glm-4-flash'];
    return [primaryModel, ...fallbacks];
  }

  /**
   * 获取可用的模板列表
   */
  getAvailableTemplates(contentType: ContentType) {
    return getTemplatesByContentType(contentType);
  }
}

// 导出单例
export const aiRouter = new AIRouter();
