# ============================================
# Backend Dockerfile
# ============================================

FROM node:20-alpine AS base
RUN apk add --no-cache openssl

# 安装依赖
FROM base AS deps
WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm@8

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建 TypeScript
RUN pnpm build

# 生产镜像
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# 复制构建产物
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
