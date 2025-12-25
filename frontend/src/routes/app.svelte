<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth, user } from '$lib/stores/auth';
  import { quota, remainingTokens, usagePercentage } from '$lib/stores/quota';
  import { onMount } from 'svelte';

  onMount(() => {
    quota.fetch();
  });

  function handleLogout() {
    auth.logout();
    goto('/');
  }

  const navItems = [
    { href: '/generate', label: '内容生成', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { href: '/history', label: '历史记录', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { href: '/templates', label: '模板库', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z' },
    { href: '/settings', label: '设置', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];
</script>

<div class="flex h-screen bg-gray-50">
  <!-- 侧边栏 -->
  <aside class="w-64 bg-white border-r flex flex-col">
    <!-- Logo -->
    <div class="p-6 border-b">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">AI</span>
        </div>
        <span class="font-semibold">内容生成平台</span>
      </div>
    </div>

    <!-- 导航 -->
    <nav class="flex-1 p-4 space-y-1">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition {$page.url.pathname === item.href
            ? 'bg-purple-50 text-purple-600 font-medium'
            : 'text-gray-600 hover:bg-gray-100'}"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
          </svg>
          {item.label}
        </a>
      {/each}
    </nav>

    <!-- 配额显示 -->
    <div class="p-4 border-t">
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-gray-600">本月配额</span>
          <span class="font-medium">{formatTokens($remainingTokens)} / {formatTokens($quota.quota?.tokensTotal || 0)}</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all"
            style="width: {$usagePercentage}%"
          ></div>
        </div>
        <button
          on:click={() => goto('/pricing')}
          class="w-full mt-3 text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          升级配额 →
        </button>
      </div>
    </div>

    <!-- 用户信息 -->
    <div class="p-4 border-t">
      {#if $user}
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-medium">
            {$user.name?.[0] || $user.email[0].toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{$user.name || '用户'}</p>
            <p class="text-xs text-gray-500 truncate">{$user.email}</p>
          </div>
          <button
            on:click={handleLogout}
            class="p-2 text-gray-400 hover:text-gray-600"
            title="退出登录"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </aside>

  <!-- 主内容区 -->
  <main class="flex-1 overflow-auto">
    <slot />
  </main>
</div>

<script lang="ts">
  function formatTokens(tokens: number): string {
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
    return tokens.toString();
  }
</script>
