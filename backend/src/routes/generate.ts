// ============================================
// 内容生成路由
// ============================================

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { aiRouter } from '../services/ai/router.js';
import {
  getUserQuota,
  checkQuota,
  deductQuota
} from '../services/quota.js';
import type { ContentType } from '../types/index.js';
import { db, generatedPosts, usageLogs } from '../database/index.js';

const generateRoutes = new Hono();

// 应用认证中间件
generateRoutes.use('*', authMiddleware);

// 生成请求 schema
const generateSchema = z.object({
  input: z.string().min(10),
  contentType: z.enum(['tweet', 'wechat_article', 'xiaohongshu', 'linkedin']),
  templateId: z.string().optional(),
  model: z.string().optional(),
  options: z
    .object({
      tone: z.enum(['casual', 'professional', 'humorous', 'serious']).optional(),
      length: z.enum(['short', 'medium', 'long']).optional(),
      includeEmojis: z.boolean().optional(),
      language: z.enum(['zh', 'en']).optional()
    })
    .optional()
});

/**
 * POST /generate
 * 生成内容
 */
generateRoutes.post('/', zValidator('json', generateSchema), async (c) => {
  const userId = c.get('userId') as string;
  const body = c.req.valid('json');

  try {
    // 获取用户配额
    const quota = await getUserQuota(userId);

    // 估算需要的 tokens (粗略估算: 输入字符数 / 2)
    const estimatedTokens = Math.ceil(body.input.length / 2) + 500;

    // 检查配额
    const hasEnoughQuota = await checkQuota(userId, estimatedTokens);
    if (!hasEnoughQuota) {
      return c.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Insufficient quota. Please upgrade your plan.'
          }
        },
        402
      );
    }

    // 获取用户套餐 (简化版，默认为 free)
    const userPlan = 'free'; // TODO: 从数据库获取

    // 调用 AI 生成
    const result = await aiRouter.generateWithRetry(
      {
        input: body.input,
        contentType: body.contentType as ContentType,
        templateId: body.templateId,
        options: body.options
      },
      userPlan
    );

    // 扣除配额
    const totalTokens = result.inputTokens + result.outputTokens;
    await deductQuota(userId, totalTokens);

    // 保存生成历史
    await db.insert(generatedPosts).values({
      userId,
      inputIdea: body.input,
      outputContent: result.content,
      contentType: body.contentType,
      templateId: body.templateId || null,
      modelUsed: result.model,
      tokensUsed: totalTokens,
      status: 'completed'
    });

    // 记录使用日志
    await db.insert(usageLogs).values({
      userId,
      tokensUsed: totalTokens,
      modelUsed: result.model,
      actionType: 'generate',
      metadata: {
        contentType: body.contentType,
        templateId: body.templateId
      }
    });

    // 返回结果
    return c.json({
      success: true,
      data: {
        id: crypto.randomUUID(),
        content: result.content,
        contentType: body.contentType,
        modelUsed: result.model,
        tokensUsed: totalTokens,
        remainingQuota: quota.tokensTotal - quota.tokensUsed - totalTokens,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Generate error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'GENERATE_FAILED',
          message: error instanceof Error ? error.message : 'Generation failed'
        }
      },
      500
    );
  }
});

/**
 * POST /stream
 * 流式生成内容
 */
generateRoutes.post('/stream', zValidator('json', generateSchema), async (c) => {
  const userId = c.get('userId') as string;
  const body = c.req.valid('json');

  try {
    // 获取用户配额
    const quota = await getUserQuota(userId);

    // 估算需要的 tokens
    const estimatedTokens = Math.ceil(body.input.length / 2) + 500;

    // 检查配额
    const hasEnoughQuota = await checkQuota(userId, estimatedTokens);
    if (!hasEnoughQuota) {
      return c.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Insufficient quota. Please upgrade your plan.'
          }
        },
        402
      );
    }

    // 设置 SSE 响应头
    return c.streamText(async (stream) => {
      try {
        // 获取用户套餐
        const userPlan = 'free'; // TODO: 从数据库获取

        // 调用 AI 生成
        const result = await aiRouter.generateWithRetry(
          {
            input: body.input,
            contentType: body.contentType as ContentType,
            templateId: body.templateId,
            options: body.options
          },
          userPlan
        );

        // 流式发送内容
        const content = result.content;
        const chunkSize = 20; // 每20个字符一个 chunk

        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, i + chunkSize);
          await stream.write(`data: ${JSON.stringify({ type: 'token', content: chunk, delta: chunk })}\n\n`);
        }

        // 扣除配额
        const totalTokens = result.inputTokens + result.outputTokens;
        await deductQuota(userId, totalTokens);

        // 保存生成历史
        await db.insert(generatedPosts).values({
          userId,
          inputIdea: body.input,
          outputContent: result.content,
          contentType: body.contentType,
          templateId: body.templateId || null,
          modelUsed: result.model,
          tokensUsed: totalTokens,
          status: 'completed'
        });

        // 发送完成信号
        await stream.write(
          `data: ${JSON.stringify({ type: 'done', finishReason: totalTokens.toString() })}\n\n`
        );
      } catch (error) {
        await stream.write(
          `data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`
        );
      }
    });
  } catch (error) {
    console.error('Stream generate error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'GENERATE_FAILED',
          message: error instanceof Error ? error.message : 'Generation failed'
        }
      },
      500
    );
  }
});

/**
 * GET /templates
 * 获取模板列表
 */
generateRoutes.get('/templates', async (c) => {
  const contentType = c.req.query('contentType') as ContentType | undefined;

  const templates = contentType
    ? aiRouter.getAvailableTemplates(contentType)
    : // 返回所有模板
      [];

  // 如果没有指定 contentType，需要从各个类型获取所有模板
  let allTemplates: ReturnType<typeof aiRouter.getAvailableTemplates> = [];
  if (!contentType) {
    const contentTypes: ContentType[] = ['tweet', 'wechat_article', 'xiaohongshu', 'linkedin'];
    for (const ct of contentTypes) {
      allTemplates = allTemplates.concat(aiRouter.getAvailableTemplates(ct));
    }
  } else {
    allTemplates = templates;
  }

  return c.json({
    success: true,
    data: allTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      contentType: t.contentType,
      category: t.category,
      options: t.options
    }))
  });
});

/**
 * GET /models
 * 获取可用模型列表
 */
generateRoutes.get('/models', async (c) => {
  const { AI_MODELS } = await import('../config/index.js');

  const models = Object.entries(AI_MODELS).map(([id, config]) => ({
    id,
    name: config.name,
    provider: config.provider,
    inputPricePer1M: config.inputPricePer1M,
    outputPricePer1M: config.outputPricePer1M,
    maxTokens: config.maxTokens
  }));

  return c.json({
    success: true,
    data: models
  });
});

/**
 * GET /history
 * 获取生成历史
 */
generateRoutes.get('/history', async (c) => {
  const userId = c.get('userId') as string;
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  const history = await db
    .select()
    .from(generatedPosts)
    .where(eq(generatedPosts.userId, userId))
    .orderBy(generatedPosts.createdAt)
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      items: history,
      total: history.length,
      hasMore: history.length === limit
    }
  });
});

/**
 * GET /history/:id
 * 获取单条历史
 */
generateRoutes.get('/history/:id', async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');

  const result = await db
    .select()
    .from(generatedPosts)
    .where(eq(generatedPosts.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' }
      },
      404
    );
  }

  const post = result[0];

  // 检查权限
  if (post.userId !== userId) {
    return c.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      },
      403
    );
  }

  return c.json({
    success: true,
    data: post
  });
});

/**
 * DELETE /history/:id
 * 删除历史记录
 */
generateRoutes.delete('/history/:id', async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');

  const result = await db
    .select()
    .from(generatedPosts)
    .where(eq(generatedPosts.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' }
      },
      404
    );
  }

  const post = result[0];

  // 检查权限
  if (post.userId !== userId) {
    return c.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      },
      403
    );
  }

  await db.delete(generatedPosts).where(eq(generatedPosts.id, id));

  return c.json({
    success: true,
    data: { message: 'Post deleted successfully' }
  });
});

export default generateRoutes;
