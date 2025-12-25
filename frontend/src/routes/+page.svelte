<script lang="ts">
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '$lib/stores/auth';

  $: if ($isAuthenticated) {
    goto('/generate');
  }
</script>

<svelte:head>
  <title>AI内容生成平台</title>
</svelte:head>

<div class="min-h-screen">
  <!-- 导航栏 -->
  <nav class="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold">AI</span>
        </div>
        <span class="font-semibold text-xl">内容生成平台</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/#features" class="text-sm text-gray-600 hover:text-gray-900">功能</a>
        <a href="/#pricing" class="text-sm text-gray-600 hover:text-gray-900">定价</a>
        <a href="/auth/login" class="text-sm text-gray-600 hover:text-gray-900">登录</a>
        <a href="/auth/register" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90">
          免费开始
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero 区域 -->
  <section class="container mx-auto px-4 py-20 text-center">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        将想法转化为高质量内容
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        AI 驱动的内容生成平台，一键生成推文、公众号文章、小红书笔记等。
        <br />
        节省 90% 的内容创作时间。
      </p>
      <div class="flex gap-4 justify-center">
        <a href="/auth/register" class="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition">
          免费开始使用
        </a>
        <a href="/#demo" class="px-8 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
          查看示例
        </a>
      </div>

      <!-- 示例截图 -->
      <div class="mt-16 relative">
        <div class="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl transform rotate-1 opacity-20"></div>
        <div class="relative bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-red-400"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div class="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div class="text-left space-y-3">
            <div class="bg-gray-100 rounded-lg p-4">
              <p class="text-sm text-gray-500 mb-2">输入想法</p>
              <p class="text-gray-800">写一篇关于 AI 如何提高工作效率的文章</p>
            </div>
            <div class="flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div class="bg-gray-100 rounded-lg p-4">
              <p class="text-sm text-gray-500 mb-2">生成结果</p>
              <p class="text-gray-800 font-semibold">AI 正在革命性地改变我们的工作方式...</p>
              <p class="text-gray-600 text-sm mt-2">#AI #工作效率 #科技</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 功能特点 -->
  <section id="features" class="container mx-auto px-4 py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-12">强大的功能，简单易用</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">一键生成</h3>
          <p class="text-gray-600">输入想法，选择风格，一键生成高质量内容。无需任何写作经验。</p>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">多种格式</h3>
          <p class="text-gray-600">支持推文、公众号文章、小红书笔记、LinkedIn 帖子等多种格式。</p>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">智能优化</h3>
          <p class="text-gray-600">AI 自动优化内容，添加合适的话题标签和 emoji，提升内容吸引力。</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 定价 -->
  <section id="pricing" class="container mx-auto px-4 py-20">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-4">简单透明的定价</h2>
      <p class="text-gray-600 text-center mb-12">选择最适合您的方案，随时可以升级</p>
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- 免费版 -->
        <div class="bg-white rounded-xl p-8 border border-gray-200">
          <h3 class="text-lg font-semibold mb-2">免费版</h3>
          <p class="text-gray-600 text-sm mb-4">适合个人体验</p>
          <div class="mb-6">
            <span class="text-4xl font-bold">¥0</span>
            <span class="text-gray-500">/月</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              10,000 tokens/月
            </li>
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              基础模板
            </li>
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              7天历史记录
            </li>
          </ul>
          <a href="/auth/register" class="block w-full py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            开始使用
          </a>
        </div>
        <!-- Pro 版 -->
        <div class="bg-gradient-to-b from-purple-600 to-pink-600 rounded-xl p-8 text-white transform scale-105 shadow-xl">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold">Pro 版</h3>
            <span class="px-2 py-1 bg-white/20 rounded text-xs">推荐</span>
          </div>
          <p class="text-white/80 text-sm mb-4">适合内容创作者</p>
          <div class="mb-6">
            <span class="text-4xl font-bold">¥29</span>
            <span class="text-white/80">/月</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              200,000 tokens/月
            </li>
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              全部模板
            </li>
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              无限历史记录
            </li>
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              优先支持
            </li>
          </ul>
          <a href="/auth/register" class="block w-full py-2 text-center bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition">
            立即订阅
          </a>
        </div>
        <!-- 专业版 -->
        <div class="bg-white rounded-xl p-8 border border-gray-200">
          <h3 class="text-lg font-semibold mb-2">专业版</h3>
          <p class="text-gray-600 text-sm mb-4">适合团队使用</p>
          <div class="mb-6">
            <span class="text-4xl font-bold">¥99</span>
            <span class="text-gray-500">/月</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              1,000,000 tokens/月
            </li>
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              自定义模板
            </li>
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              API 访问
            </li>
            <li class="flex items-center gap-2 text-sm">
              <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              团队协作
            </li>
          </ul>
          <a href="/auth/register" class="block w-full py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            联系我们
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- 页脚 -->
  <footer class="border-t bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="flex items-center gap-2 mb-4 md:mb-0">
          <div class="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center">
            <span class="text-white text-xs font-bold">AI</span>
          </div>
          <span class="font-semibold">内容生成平台</span>
        </div>
        <p class="text-gray-500 text-sm">© 2025 AI 内容生成平台. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>
