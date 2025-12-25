import { writable, derived } from 'svelte/store';
import type { GenerateRequest, GenerateResponse, StreamChunk } from '$types';

// ============================================
// Generate Store
// ============================================

interface GenerateState {
  isGenerating: boolean;
  isStreaming: boolean;
  generatedContent: string;
  response: GenerateResponse | null;
  error: string | null;
}

function createGenerateStore() {
  const { subscribe, set, update } = writable<GenerateState>({
    isGenerating: false,
    isStreaming: false,
    generatedContent: '',
    response: null,
    error: null
  });

  return {
    subscribe,

    // 普通生成
    generate: async (request: GenerateRequest) => {
      update((state) => ({
        ...state,
        isGenerating: true,
        generatedContent: '',
        response: null,
        error: null
      }));

      try {
        const response = await fetch('/api/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '生成失败');
        }

        const data: GenerateResponse = await response.json();

        update((state) => ({
          ...state,
          isGenerating: false,
          generatedContent: data.content,
          response: data
        }));

        return data;
      } catch (error) {
        update((state) => ({
          ...state,
          isGenerating: false,
          error: error instanceof Error ? error.message : '生成失败'
        }));
        throw error;
      }
    },

    // 流式生成
    generateStream: async (request: GenerateRequest, onChunk?: (chunk: StreamChunk) => void) => {
      update((state) => ({
        ...state,
        isGenerating: true,
        isStreaming: true,
        generatedContent: '',
        response: null,
        error: null
      }));

      try {
        const response = await fetch('/api/v1/generate/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          throw new Error('生成失败');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let content = '';
        let totalTokens = 0;

        if (!reader) {
          throw new Error('无法读取响应流');
        }

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.startsWith('data:'));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(5).trim()) as StreamChunk;

              if (data.type === 'token' && data.content) {
                content += data.content;
                update((state) => ({
                  ...state,
                  generatedContent: content
                }));
                onChunk?.(data);
              } else if (data.type === 'done') {
                totalTokens = parseInt(data.finishReason || '0');
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }

        update((state) => ({
          ...state,
          isGenerating: false,
          isStreaming: false,
          response: {
            id: crypto.randomUUID(),
            content,
            contentType: request.contentType,
            modelUsed: request.model || 'default',
            tokensUsed: totalTokens,
            remainingQuota: 0,
            createdAt: new Date().toISOString()
          } as GenerateResponse
        }));

        return { content, tokensUsed: totalTokens };
      } catch (error) {
        update((state) => ({
          ...state,
          isGenerating: false,
          isStreaming: false,
          error: error instanceof Error ? error.message : '生成失败'
        }));
        throw error;
      }
    },

    // 重置状态
    reset: () => {
      set({
        isGenerating: false,
        isStreaming: false,
        generatedContent: '',
        response: null,
        error: null
      });
    },

    // 清空生成的内容
    clearContent: () => {
      update((state) => ({ ...state, generatedContent: '', response: null }));
    }
  };
}

export const generate = createGenerateStore();

// 派生状态
export const canCopy = derived(generate, ($generate) => $generate.generatedContent.length > 0);
export const canRegenerate = derived(generate, ($generate) => !$generate.isGenerating);
