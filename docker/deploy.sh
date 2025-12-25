#!/bin/bash

# ============================================
# 阿里云服务器部署脚本
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AI 内容生成平台 - 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# ============================================
# 1. 安装 Docker 和 Docker Compose
# ============================================
echo -e "${YELLOW}[1/6] 检查 Docker 安装...${NC}"

if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker 已安装${NC}"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
fi

# ============================================
# 2. 配置环境变量
# ============================================
echo -e "${YELLOW}[2/6] 配置环境变量...${NC}"

if [ ! -f .env ]; then
    echo "请输入数据库密码:"
    read -s DB_PASSWORD
    echo ""

    echo "请输入 JWT_SECRET (至少32位随机字符):"
    read -s JWT_SECRET
    echo ""

    cat > .env << EOF
# 数据库配置
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=ai_content

# Redis 密码
REDIS_PASSWORD=$(openssl rand -hex 16)

# JWT 密钥
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 应用配置
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com

# AI API Keys (请在此处添加你的 API Keys)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
QIWEN_API_KEY=
EOF

    echo -e "${GREEN}✓ 环境变量已创建${NC}"
    echo -e "${YELLOW}请编辑 .env 文件，添加你的 AI API Keys${NC}"
else
    echo -e "${GREEN}✓ 环境变量文件已存在${NC}"
fi

# ============================================
# 3. 配置 SSL 证书 (Let's Encrypt)
# ============================================
echo -e "${YELLOW}[3/6] 配置 SSL 证书...${NC}"

read -p "是否配置 SSL 证书? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "请输入你的域名: " DOMAIN

    # 安装 certbot
    if ! command -v certbot &> /dev/null; then
        apt-get update
        apt-get install -y certbot
    fi

    # 停止 nginx 以释放 80 端口
    docker-compose -f docker/docker-compose.prod.yml down frontend 2>/dev/null || true

    # 获取证书
    mkdir -p docker/ssl
    certbot certonly --standalone -d $DOMAIN --email your-email@example.com --agree-tos --non-interactive

    # 复制证书
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/ssl/

    echo -e "${GREEN}✓ SSL 证书已配置${NC}"
else
    echo -e "${YELLOW}跳过 SSL 配置，将使用 HTTP${NC}"
fi

# ============================================
# 4. 运行数据库迁移
# ============================================
echo -e "${YELLOW}[4/6] 运行数据库迁移...${NC}"

# 启动数据库
docker-compose -f docker/docker-compose.prod.yml up -d postgres redis

# 等待数据库启动
echo "等待数据库启动..."
sleep 10

# 运行迁移
docker-compose -f docker/docker-compose.prod.yml run --rm backend pnpm db:migrate

echo -e "${GREEN}✓ 数据库迁移完成${NC}"

# ============================================
# 5. 构建和启动服务
# ============================================
echo -e "${YELLOW}[5/6] 构建和启动服务...${NC}"

# 构建镜像
docker-compose -f docker/docker-compose.prod.yml build

# 启动服务
docker-compose -f docker/docker-compose.prod.yml up -d

echo -e "${GREEN}✓ 服务已启动${NC}"

# ============================================
# 6. 配置自动更新 SSL 证书
# ============================================
echo -e "${YELLOW}[6/6] 配置证书自动更新...${NC}"

read -p "是否配置证书自动更新? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 添加 cron 任务
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker-compose -f $(pwd)/docker/docker-compose.prod.yml restart frontend") | crontab -
    echo -e "${GREEN}✓ 证书自动更新已配置 (每天凌晨3点)${NC}"
else
    echo -e "${YELLOW}跳过自动更新配置${NC}"
fi

# ============================================
# 完成
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "服务状态:"
docker-compose -f docker/docker-compose.prod.yml ps
echo ""
echo "查看日志: docker-compose -f docker/docker-compose.prod.yml logs -f"
echo "重启服务: docker-compose -f docker/docker-compose.prod.yml restart"
echo "停止服务: docker-compose -f docker/docker-compose.prod.yml down"
