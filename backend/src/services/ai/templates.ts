// ============================================
// 提示词模板系统
// ============================================

import type { Template, ContentType } from '../../types/index.js';

// 推文模板
export const tweetTemplates: Template[] = [
  {
    id: 'tweet-casual',
    name: '轻松推文',
    description: '适合日常分享，语气轻松自然',
    contentType: 'tweet',
    category: 'casual',
    systemPrompt:
      '你是一位轻松幽默的社交媒体内容创作者。你擅长用简短有力的语言表达想法，让内容在社交媒体上更容易传播。',
    userPromptTemplate: (input: string, options: { includeEmojis?: boolean }) => `
请将以下想法转化为一条吸引人的推文（140字以内）：

想法：${input}

要求：
- 开头要有吸引力，能抓住读者注意力
- 使用适当的emoji（${options.includeEmojis ? '是' : '否'}）
- 添加2-3个相关话题标签
- 语言轻松自然，适合社交媒体
- 避免过度营销感

输出推文：
`.trim(),
    options: {
      supportedTones: ['casual', 'humorous'],
      supportedLengths: ['short'],
      defaultTone: 'casual',
      defaultLength: 'short'
    }
  },
  {
    id: 'tweet-professional',
    name: '专业推文',
    description: '适合商业观点分享，语气专业',
    contentType: 'tweet',
    category: 'professional',
    systemPrompt:
      '你是一位专业的商业内容创作者。你擅长将复杂的概念简化，用专业但不失亲和力的语言分享商业见解。',
    userPromptTemplate: (input: string, options: { includeEmojis?: boolean }) => `
请将以下想法转化为一条专业的商业推文（140字以内）：

想法：${input}

要求：
- 观点明确，有洞察力
- 专业但不失亲和力
- 添加相关行业话题标签
- 引发思考和讨论

输出推文：
`.trim(),
    options: {
      supportedTones: ['professional', 'serious'],
      supportedLengths: ['short'],
      defaultTone: 'professional',
      defaultLength: 'short'
    }
  }
];

// 公众号文章模板
export const wechatTemplates: Template[] = [
  {
    id: 'wechat-standard',
    name: '标准公众号文章',
    description: '结构完整，适合大多数主题',
    contentType: 'wechat_article',
    category: 'standard',
    systemPrompt:
      '你是一位专业的公众号内容创作者。你擅长写深入浅出的文章，让复杂的概念变得易懂，同时保持内容的深度和价值。',
    userPromptTemplate: (input: string, options: { includeEmojis?: boolean }) => `
请根据以下想法，写一篇高质量的公众号文章：

主题：${input}

结构要求：
1. 吸引人的标题（3-5个选项）
2. 引人入胜的开头（可以用故事/数据/问题/金句）
3. 正文分3-5个小节，每节有小标题
4. 总结与行动号召
5. 适合手机阅读的排版

风格要求：
- 深入浅出，有个人观点
- ${options.includeEmojis ? '适当使用emoji增强可读性' : '不使用emoji'}
- 每段不超过200字
- 用数据和案例支撑观点

输出格式：
## 标题选项

## 正文

[文章内容]

## 总结

[总结内容]
`.trim(),
    options: {
      supportedTones: ['casual', 'professional', 'serious'],
      supportedLengths: ['medium', 'long'],
      defaultTone: 'professional',
      defaultLength: 'medium'
    }
  },
  {
    id: 'wechat-story',
    name: '故事型文章',
    description: '以故事为主线，增强可读性',
    contentType: 'wechat_article',
    category: 'story',
    systemPrompt:
      '你是一位擅长讲故事的公众号作者。你用生动的叙述和真实的情感连接读者，让读者在故事中获得启发。',
    userPromptTemplate: (input: string) => `
请根据以下想法，写一篇以故事为主线的公众号文章：

主题：${input}

结构要求：
1. 吸引人的标题
2. 以一个真实或虚构的故事开场
3. 从故事中引出观点和思考
4. 给出实用的建议
5. 引发共鸣的结尾

风格要求：
- 故事生动，细节丰富
- 情感真挚，能引发共鸣
- 观点从故事自然引出
- 给出可操作的建议
`.trim(),
    options: {
      supportedTones: ['casual', 'humorous'],
      supportedLengths: ['medium', 'long'],
      defaultTone: 'casual',
      defaultLength: 'long'
    }
  }
];

// 小红书模板
export const xiaohongshuTemplates: Template[] = [
  {
    id: 'xhs-lifestyle',
    name: '生活方式笔记',
    description: '分享生活方式和日常',
    contentType: 'xiaohongshu',
    category: 'lifestyle',
    systemPrompt:
      '你是一位小红书生活方式博主。你擅长用轻松亲切的语气分享生活点滴，内容实用又有温度。',
    userPromptTemplate: (input: string) => `
请将以下想法转化为小红书笔记风格的内容：

想法：${input}

要求：
- 标题要吸睛，使用emoji和数字
- 内容分段清晰，用emoji做列表标记
- 第一段要引起共鸣或好奇
- 中间部分分享干货或经验
- 结尾引导互动（点赞、收藏、评论）
- 最后加5-8个相关话题标签
- 女性友好的表达方式
- 语气像朋友聊天

输出格式：
标题

正文内容

#标签1 #标签2 ...
`.trim(),
    options: {
      supportedTones: ['casual', 'humorous'],
      supportedLengths: ['short', 'medium'],
      defaultTone: 'casual',
      defaultLength: 'medium'
    }
  },
  {
    id: 'xhs-product',
    name: '产品测评笔记',
    description: '产品使用体验和测评',
    contentType: 'xiaohongshu',
    category: 'product',
    systemPrompt:
      '你是一位小红书产品测评博主。你擅长用真实客观的视角评测产品，帮助用户做出购买决策。',
    userPromptTemplate: (input: string) => `
请将以下想法转化为小红书产品测评笔记：

产品/主题：${input}

要求：
- 标题突出产品核心卖点或使用场景
- 包含：外观/使用感受/优缺点/购买建议
- 用emoji做视觉分隔
- 真实客观，不过分吹捧
- 给出明确的购买建议（值不值得买/适合谁）
- 最后加相关标签

输出格式：
标题

【产品名称】

使用感受...

优点...
缺点...

购买建议...

#标签
`.trim(),
    options: {
      supportedTones: ['professional', 'casual'],
      supportedLengths: ['medium'],
      defaultTone: 'professional',
      defaultLength: 'medium'
    }
  }
];

// LinkedIn 模板
export const linkedinTemplates: Template[] = [
  {
    id: 'linkedin-professional',
    name: '职场洞察',
    description: '分享职场经验和见解',
    contentType: 'linkedin',
    category: 'professional',
    systemPrompt:
      '你是一位资深的职场导师。你用温暖的语气分享职场智慧，帮助职场人成长和突破。',
    userPromptTemplate: (input: string) => `
请将以下想法转化为 LinkedIn 帖子：

想法：${input}

要求：
- 开头用一个引人共鸣的职场场景或问题
- 分享1-3个实用建议
- 用清晰的段落分隔，每段不超过3行
- 使用专业的语气，但保持温暖
- 结尾提出一个问题，引发讨论
- 添加3-5个相关话题标签

输出格式：
[引人入胜的开头]

[正文段落，用空行分隔]

[引发讨论的问题]

#标签
`.trim(),
    options: {
      supportedTones: ['professional', 'serious'],
      supportedLengths: ['medium', 'long'],
      defaultTone: 'professional',
      defaultLength: 'medium'
    }
  }
];

// 模板注册表
export const templateRegistry = new Map<string, Template>();

// 注册所有模板
function registerTemplates() {
  // 推文模板
  tweetTemplates.forEach((t) => templateRegistry.set(t.id, t));
  // 公众号模板
  wechatTemplates.forEach((t) => templateRegistry.set(t.id, t));
  // 小红书模板
  xiaohongshuTemplates.forEach((t) => templateRegistry.set(t.id, t));
  // LinkedIn 模板
  linkedinTemplates.forEach((t) => templateRegistry.set(t.id, t));
}

// 初始化时注册所有模板
registerTemplates();

// 获取模板
export function getTemplate(id: string): Template | undefined {
  return templateRegistry.get(id);
}

// 获取内容类型的所有模板
export function getTemplatesByContentType(contentType: ContentType): Template[] {
  return Array.from(templateRegistry.values()).filter((t) => t.contentType === contentType);
}

// 获取默认模板
export function getDefaultTemplate(contentType: ContentType): Template | undefined {
  const templates = getTemplatesByContentType(contentType);
  return templates[0];
}
