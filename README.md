# AI 内容生成平台

一个 SaaS 平台，帮助用户将简单想法快速转化为高质量的社交媒体内容。

## 项目结构

```
ai-content-platform/
├── frontend/          # SvelteKit 前端应用
├── backend/           # Node.js + Hono 后端 API
├── database/          # 数据库迁移和种子数据
├── docker/            # Docker 配置文件
└── docs/              # 项目文档
```

## 技术栈

### 前端
- **框架**: SvelteKit
- **UI**: shadcn-svelte + TailwindCSS
- **状态**: Svelte Stores
- **编辑器**: Tiptap

### 后端
- **运行时**: Node.js (Bun)
- **框架**: Hono
- **数据库**: PostgreSQL
- **缓存**: Redis
- **ORM**: Drizzle ORM

### AI 服务
- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude 3.5 Sonnet)
- 阿里云 (通义千问)
- 百度 (文心一言)

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14
- Redis >= 6

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动数据库 (Docker)
docker-compose up -d

# 运行数据库迁移
pnpm --filter backend db:migrate

# 启动开发服务器
pnpm dev
```

### 环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
# 应用
APP_URL=http://localhost:5173
PORT=3000

# 数据库
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_content
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-this

# AI API Keys
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
QIWEN_API_KEY=xxx
```

## 部署

### 阿里云部署

1. 安装 Docker 和 Docker Compose
2. 配置 Nginx 反向代理
3. 配置 SSL 证书

```bash
# 构建镜像
docker-compose -f docker/docker-compose.prod.yml build

# 启动服务
docker-compose -f docker/docker-compose.prod.yml up -d
```

## 开发指南

- [技术设计文档](./docs/技术设计文档.md)
- [API 文档](./docs/API.md)
- [数据库设计](./docs/DATABASE.md)

## License

MIT
