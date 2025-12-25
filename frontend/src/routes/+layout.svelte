<script lang="ts">
  import '../lib/styles/app.css';
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  // 初始化认证状态
  onMount(() => {
    auth.init();
  });
</script>

<svelte:head>
  <meta name="description" content="AI内容生成平台 - 将想法转化为高质量推文和公众号文章" />
</svelte:head>

{% if !$isAuthenticated %}
  <slot />
{% else %}
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <slot />
  </div>
{% endif %}
