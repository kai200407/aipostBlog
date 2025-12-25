<script lang="ts">
  import app from '../app.svelte';
  import { generate, canCopy, canRegenerate } from '$lib/stores/generate';
  import { quota } from '$lib/stores/quota';
  import { copyToClipboard } from '$lib/utils/cn';
  import type { ContentType } from '$types';

  let input = '';
  let selectedContentType: ContentType = 'tweet';
  let selectedTone: 'casual' | 'professional' | 'humorous' | 'serious' = 'casual';
  let selectedModel = 'glm-4-flash';
  let includeEmojis = true;
  let isStreamMode = true;
  let showCopySuccess = false;

  const contentTypes: { value: ContentType; label: string; icon: string }[] = [
    { value: 'tweet', label: '推文/微博', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    {
      value: 'wechat_article',
      label: '公众号文章',
      icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'
    },
    { value: 'xiaohongshu', label: '小红书笔记', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    {
      value: 'linkedin',
      label: 'LinkedIn 帖子',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    }
  ];

  const tones: { value: typeof selectedTone; label: string }[] = [
    { value: 'casual', label: '轻松随意' },
    { value: 'professional', label: '专业正式' },
    { value: 'humorous', label: '幽默风趣' },
    { value: 'serious', label: '严肃认真' }
  ];

  const models: { value: string; label: string; description: string; tag?: string }[] = [
    {
      value: 'glm-4-flash',
      label: 'GLM-4 Flash',
      description: '智谱AI免费模型，速度快',
      tag: '免费'
    },
    {
      value: 'glm-4-air',
      label: 'GLM-4 Air',
      description: '智谱AI高性价比模型'
    },
    { value: 'glm-4', label: 'GLM-4', description: '智谱AI主力模型，中文能力强' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: '快速经济，适合日常内容' },
    { value: 'gpt-4o', label: 'GPT-4o', description: '最高质量，适合重要内容' },
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', description: '擅长长文写作' },
    { value: 'qwen-plus', label: '通义千问 Plus', description: '中文优化，性价比高' }
  ];

  async function handleGenerate() {
    if (!input.trim()) return;

    try {
      if (isStreamMode) {
        await generate.generateStream(
          {
            input,
            contentType: selectedContentType,
            model: selectedModel,
            options: {
              tone: selectedTone,
              includeEmojis,
              language: 'zh'
            }
          },
          (chunk) => {
            // 可选：处理每个 chunk
          }
        );
      } else {
        await generate.generate({
          input,
          contentType: selectedContentType,
          model: selectedModel,
          options: {
            tone: selectedTone,
            includeEmojis,
            language: 'zh'
          }
        });
      }

      // 更新配额
      if ($generate.response) {
        quota.updateUsed($generate.response.tokensUsed);
      }
    } catch (error) {
      console.error('生成失败:', error);
    }
  }

  async function handleCopy() {
    if ($generate.generatedContent) {
      const success = await copyToClipboard($generate.generatedContent);
      if (success) {
        showCopySuccess = true;
        setTimeout(() => (showCopySuccess = false), 2000);
      }
    }
  }

  function handleRegenerate() {
    handleGenerate();
  }

  function handleClear() {
    generate.clearContent();
    input = '';
  }
</script>

<svelte:head>
  <title>内容生成 - AI内容生成平台</title>
</svelte:head>

<app>
  <div class="p-8">
    <div class="max-w-6xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">内容生成</h1>
        <p class="text-gray-600">输入你的想法，AI 将为你生成高质量的内容</p>
      </div>

      <div class="grid lg:grid-cols-2 gap-8">
        <!-- 左侧：输入区 -->
        <div class="space-y-6">
          <!-- 内容类型选择 -->
          <div class="bg-white rounded-xl p-6 shadow-sm">
            <label class="block text-sm font-medium mb-3">选择内容类型</label>
            <div class="grid grid-cols-2 gap-3">
              {#each contentTypes as type}
                <button
                  on:click={() => (selectedContentType = type.value)}
                  class="flex items-center gap-3 p-4 rounded-lg border-2 transition {$selectedContentType ===
                  type.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'}"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={type.icon} />
                  </svg>
                  <span class="font-medium text-sm">{type.label}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- 风格设置 -->
          <div class="bg-white rounded-xl p-6 shadow-sm">
            <label class="block text-sm font-medium mb-3">写作风格</label>
            <div class="grid grid-cols-4 gap-2">
              {#each tones as tone}
                <button
                  on:click={() => (selectedTone = tone.value)}
                  class="px-3 py-2 rounded-lg text-sm font-medium transition {$selectedTone ===
                  tone.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                >
                  {tone.label}
                </button>
              {/each}
            </div>
          </div>

          <!-- 模型选择 -->
          <div class="bg-white rounded-xl p-6 shadow-sm">
            <label class="block text-sm font-medium mb-3">AI 模型</label>
            <div class="space-y-2">
              {#each models as model}
                <button
                  on:click={() => (selectedModel = model.value)}
                  class="w-full flex items-center justify-between p-4 rounded-lg border-2 transition {$selectedModel ===
                  model.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'}"
                >
                  <div class="text-left flex items-center gap-2">
                    <div>
                      <p class="font-medium flex items-center gap-2">
                        {model.label}
                        {#if model.tag}
                          <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                            >{model.tag}</span
                          >
                        {/if}
                      </p>
                      <p class="text-sm text-gray-500">{model.description}</p>
                    </div>
                  </div>
                  {#if $selectedModel === model.value}
                    <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {/if}
                </button>
              {/each}
            </div>
          </div>

          <!-- 选项 -->
          <div class="bg-white rounded-xl p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">流式生成</p>
                <p class="text-sm text-gray-500">实时显示生成过程</p>
              </div>
              <button
                on:click={() => (isStreamMode = !isStreamMode)}
                class="relative w-12 h-6 rounded-full transition {isStreamMode
                  ? 'bg-purple-600'
                  : 'bg-gray-300'}"
              >
                <span
                  class="absolute top-1 w-4 h-4 bg-white rounded-full transition {isStreamMode
                    ? 'left-7'
                    : 'left-1'}"
                ></span>
              </button>
            </div>
            <div class="flex items-center justify-between mt-4">
              <div>
                <p class="font-medium">包含 Emoji</p>
                <p class="text-sm text-gray-500">自动添加合适的表情符号</p>
              </div>
              <button
                on:click={() => (includeEmojis = !includeEmojis)}
                class="relative w-12 h-6 rounded-full transition {includeEmojis
                  ? 'bg-purple-600'
                  : 'bg-gray-300'}"
              >
                <span
                  class="absolute top-1 w-4 h-4 bg-white rounded-full transition {includeEmojis
                    ? 'left-7'
                    : 'left-1'}"
                ></span>
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：输出区 -->
        <div class="space-y-6">
          <!-- 输入框 -->
          <div class="bg-white rounded-xl p-6 shadow-sm">
            <label class="block text-sm font-medium mb-3">你的想法</label>
            <textarea
              bind:value={input}
              placeholder="例如：写一篇关于 AI 如何提高工作效率的文章..."
              class="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>

            <!-- 生成按钮 -->
            <button
              on:click={handleGenerate}
              disabled={!input.trim() || $generate.isGenerating}
              class="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {#if $generate.isGenerating}
                <svg
                  class="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>生成中...</span>
              {:else}
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>生成内容</span>
              {/if}
            </button>
          </div>

          <!-- 输出框 -->
          <div class="bg-white rounded-xl p-6 shadow-sm min-h-[400px]">
            <div class="flex items-center justify-between mb-4">
              <label class="text-sm font-medium">生成结果</label>
              {#if $generate.response}
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <span>使用 {formatTokens($generate.response.tokensUsed)} tokens</span>
                </div>
              {/if}
            </div>

            {#if $generate.isGenerating && $generate.generatedContent === ''}
              <div class="flex items-center justify-center h-64">
                <div class="text-center">
                  <div class="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p class="text-gray-500">AI 正在创作中...</p>
                </div>
              </div>
            {:else if $generate.generatedContent}
              <div class="prose prose-sm max-w-none">
                <div class="whitespace-pre-wrap">{@html $generate.generatedContent}</div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex gap-3 mt-6 pt-6 border-t">
                <button
                  on:click={handleCopy}
                  disabled={$generate.isGenerating}
                  class="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {#if showCopySuccess}
                    <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    已复制
                  {:else}
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    复制
                  {/if}
                </button>
                <button
                  on:click={handleRegenerate}
                  disabled={$generate.isGenerating}
                  class="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  重新生成
                </button>
                <button
                  on:click={handleClear}
                  disabled={$generate.isGenerating}
                  class="flex-1 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  清空
                </button>
              </div>
            {:else}
              <div class="flex items-center justify-center h-64 text-gray-400">
                <div class="text-center">
                  <svg
                    class="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>生成的内容将显示在这里</p>
                </div>
              </div>
            {/if}

            {#if $generate.error}
              <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {$generate.error}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</app>

<script lang="ts">
  function formatTokens(tokens: number): string {
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
    return tokens.toString();
  }
</script>
