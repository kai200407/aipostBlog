# ============================================
# Frontend Dockerfile
# ============================================

FROM node:20-alpine AS base
RUN apk add --no-cache openssl

# ============================================
# Dependencies
# ============================================
FROM base AS deps
WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm@8

# 安装依赖
RUN pnpm install --frozen-lockfile

# ============================================
# Build
# ============================================
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN pnpm build

# ============================================
# Production
# ============================================
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# 复制构建产物
COPY --from=build /app/build ./build

# 安装 Nginx
RUN apk add --no-cache nginx

# 复制 Nginx 配置
RUN rm -rf /etc/nginx/conf.d/*
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # SSE 支持
    location /api/v1/generate/stream {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host \$host;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# 复制静态文件到 Nginx 目录
RUN cp -r /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
