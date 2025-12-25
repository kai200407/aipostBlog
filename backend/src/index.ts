// ============================================
// 主入口文件
// ============================================

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from './config/index.js';
import { healthCheck } from './database/connection.js';

// 导入路由
import authRoutes from './routes/auth.js';
import generateRoutes from './routes/generate.js';
import quotaRoutes from './routes/quota.js';
import userRoutes from './routes/user.js';

// 创建 Hono 应用
const app = new Hono();

// 全局中间件
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true
  })
);

// 健康检查
app.get('/health', async (c) => {
  const health = await healthCheck();
  return c.json(health);
});

// API 路由
const api = new Hono();

api.route('/auth', authRoutes);
api.route('/generate', generateRoutes);
api.route('/quota', quotaRoutes);
api.route('/user', userRoutes);

app.route('/api/v1', api);

// 404 处理
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found'
      }
    },
    404
  );
});

// 错误处理
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred'
      }
    },
    500
  );
});

// 启动服务器
const port = config.PORT;

console.log(`
╔═════════════════════════════════════════════════════════╗
║                                                           ║
║        🚀 AI Content Generation Platform                 ║
║                                                           ║
║        Server running on port ${port}                        ║
║        Environment: ${config.NODE_ENV}                      ║
║        API: http://localhost:${port}/api/v1                  ║
║                                                           ║
╚═════════════════════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const { closeConnections } = await import('./database/connection.js');
  await closeConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const { closeConnections } = await import('./database/connection.js');
  await closeConnections();
  process.exit(0);
});

export default app;
