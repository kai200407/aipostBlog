// ============================================
// AI Provider 统一接口实现
// ============================================

import type {
  AIProvider,
  AIGenerateRequest,
  AIGenerateResponse,
  AIStreamChunk
} from '../../types/index.js';
import { config } from '../../config/index.js';
import { SignJWT } from 'jose';

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  name = 'openai';

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const apiKey = config.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${config.OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = (await response.json()) as OpenAIResponse;

    return {
      content: data.choices[0].message.content,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      model: data.model,
      finishReason: data.choices[0].finish_reason === 'stop' ? 'stop' : 'length'
    };
  }

  async *stream(request: AIGenerateRequest): AsyncIterable<AIStreamChunk> {
    const apiKey = config.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${config.OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices[0]?.delta?.content;
          if (delta) {
            yield { type: 'token', content: delta, delta };
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    yield { type: 'done' };
  }
}

// OpenAI API 响应类型
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Anthropic Claude Provider
export class AnthropicProvider implements AIProvider {
  name = 'anthropic';

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const apiKey = config.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        system: request.systemPrompt || '',
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = (await response.json()) as AnthropicResponse;

    // 提取文本内容
    let content = '';
    for (const block of data.content) {
      if (block.type === 'text') {
        content += block.text;
      }
    }

    return {
      content,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      model: data.model,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : 'length'
    };
  }

  async *stream(request: AIGenerateRequest): AsyncIterable<AIStreamChunk> {
    const apiKey = config.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        system: request.systemPrompt || '',
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.type === 'content_block_delta' && json.delta?.text) {
            yield { type: 'token', content: json.delta.text, delta: json.delta.text };
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    yield { type: 'done' };
  }
}

// Anthropic API 响应类型
interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// 阿里云通义千问 Provider
export class QiwensProvider implements AIProvider {
  name = 'qiwens';

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const apiKey = config.QIWEN_API_KEY;
    if (!apiKey) {
      throw new Error('Qiwens API key not configured');
    }

    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          input: {
            messages: [
              ...(request.systemPrompt
                ? [{ role: 'system', content: request.systemPrompt }]
                : []),
              { role: 'user', content: request.prompt }
            ]
          },
          parameters: {
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2000,
            result_format: 'message'
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qiwens API error: ${error}`);
    }

    const data = (await response.json()) as QiwensResponse;

    return {
      content: data.output.choices[0].message.content,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      model: request.model,
      finishReason: 'stop'
    };
  }
}

interface QiwensResponse {
  output: {
    choices: Array<{ message: { content: string } }>;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// 智谱AI (ChatGLM) Provider
export class ZhipuProvider implements AIProvider {
  name = 'zhipu';

  /**
   * 生成智谱AI的JWT Token
   * 智谱API使用API Key生成JWT进行认证
   * API Key格式: id.secret
   */
  private async generateToken(apiKey: string): Promise<string> {
    const [id, secret] = apiKey.split('.');
    if (!id || !secret) {
      throw new Error('Invalid Zhipu API key format');
    }

    const now = Date.now();
    const exp = now + 3600 * 1000; // 1小时过期

    const token = await new SignJWT({
      api_key: id,
      exp: Math.floor(exp / 1000),
      timestamp: now
    })
      .setProtectedHeader({ alg: 'HS256', sign_type: 'SIGN' })
      .sign(new TextEncoder().encode(secret));

    return token;
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const apiKey = config.ZHIPU_API_KEY;
    if (!apiKey) {
      throw new Error('Zhipu API key not configured');
    }

    // 生成JWT Token
    const token = await this.generateToken(apiKey);

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        top_p: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Zhipu API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = `Zhipu API error: ${errorJson.error?.message || errorText}`;
      } catch {
        errorMessage = `Zhipu API error: ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as ZhipuResponse;

    return {
      content: data.choices[0].message.content,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      model: data.model,
      finishReason: data.choices[0].finish_reason === 'stop' ? 'stop' : 'length'
    };
  }

  async *stream(request: AIGenerateRequest): AsyncIterable<AIStreamChunk> {
    const apiKey = config.ZHIPU_API_KEY;
    if (!apiKey) {
      throw new Error('Zhipu API key not configured');
    }

    // 生成JWT Token
    const token = await this.generateToken(apiKey);

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        top_p: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Zhipu API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = `Zhipu API error: ${errorJson.error?.message || errorText}`;
      } catch {
        errorMessage = `Zhipu API error: ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices[0]?.delta?.content;
          if (delta) {
            yield { type: 'token', content: delta, delta };
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    yield { type: 'done' };
  }
}

// 智谱AI API 响应类型
interface ZhipuResponse {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Provider 工厂
export function createProvider(providerName: string): AIProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'qiwens':
      return new QiwensProvider();
    case 'zhipu':
      return new ZhipuProvider();
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

// 获取模型对应的 Provider
export function getProviderForModel(model: string): string {
  const modelProviderMap: Record<string, string> = {
    // OpenAI
    'gpt-4o': 'openai',
    'gpt-4o-mini': 'openai',
    'gpt-3.5-turbo': 'openai',
    // Anthropic
    'claude-3-5-sonnet': 'anthropic',
    'claude-3-haiku': 'anthropic',
    // 阿里云
    'qwen-plus': 'qiwens',
    'qwen-turbo': 'qiwens',
    // 智谱AI
    'glm-4-flash': 'zhipu',
    'glm-4-air': 'zhipu',
    'glm-4': 'zhipu',
    'glm-4-plus': 'zhipu',
    'glm-4-long': 'zhipu'
  };

  return modelProviderMap[model] || 'openai';
}
