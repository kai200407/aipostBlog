#!/bin/bash

# ============================================
# AI 内容生成平台 - 一键部署脚本
# 适用于 2核2G 阿里云服务器
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AI 内容生成平台 - 一键部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 获取项目目录
PROJECT_DIR="/var/www/ai-content-platform"

# ============================================
# 1. 安装 Docker
# ============================================
echo -e "${YELLOW}[1/8] 检查 Docker 安装...${NC}"

if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker 已安装${NC}"
fi

# ============================================
# 2. 安装 Docker Compose
# ============================================
echo -e "${YELLOW}[2/8] 检查 Docker Compose 安装...${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
fi

# ============================================
# 3. 配置 Swap（防止内存不足）
# ============================================
echo -e "${YELLOW}[3/8] 配置 Swap...${NC}"

if [ ! -f /swapfile ]; then
    echo "创建 2GB Swap 文件..."
    dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo -e "${GREEN}✓ Swap 配置完成${NC}"
else
    echo -e "${GREEN}✓ Swap 已存在${NC}"
fi

# ============================================
# 4. 配置防火墙
# ============================================
echo -e "${YELLOW}[4/8] 配置防火墙...${NC}"

if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo -e "${GREEN}✓ 防火墙已配置${NC}"
elif command -v ufw &> /dev/null; then
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    echo -e "${GREEN}✓ 防火墙已配置${NC}"
else
    echo -e "${YELLOW}⚠ 未检测到防火墙，请手动配置${NC}"
fi

echo ""
echo -e "${RED}重要: 请确保在阿里云控制台配置安全组规则！${NC}"
echo -e "${RED}需要开放端口: 80 (HTTP), 443 (HTTPS)${NC}"
echo ""
read -p "按回车继续..."

# ============================================
# 5. 创建项目目录
# ============================================
echo -e "${YELLOW}[5/8] 准备项目目录...${NC}"

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p $PROJECT_DIR
    echo -e "${GREEN}✓ 项目目录已创建${NC}"
else
    echo -e "${GREEN}✓ 项目目录已存在${NC}"
fi

# 检查项目是否已存在
if [ -f "$PROJECT_DIR/backend/package.json" ]; then
    echo -e "${YELLOW}项目已存在，是否更新？ (y/n)${NC}"
    read -r UPDATE_PROJECT
    if [[ ! $UPDATE_PROJECT =~ ^[Yy]$ ]]; then
        echo "跳过项目更新"
    fi
else
    echo ""
    echo -e "${YELLOW}请选择项目上传方式:${NC}"
    echo "1. 使用 Git 克隆"
    echo "2. 手动上传后继续"
    read -p "请选择 (1/2): " UPLOAD_METHOD

    if [ "$UPLOAD_METHOD" = "1" ]; then
        read -p "请输入 Git 仓库地址: " GIT_URL
        git clone $GIT_URL $PROJECT_DIR
    else
        echo ""
        echo -e "${YELLOW}请手动上传项目代码到 $PROJECT_DIR${NC}"
        echo "可以使用以下命令:"
        echo "  scp -r ./ user@your-server:$PROJECT_DIR"
        echo ""
        read -p "上传完成后按回车继续..."
    fi
fi

cd $PROJECT_DIR

# ============================================
# 6. 配置环境变量
# ============================================
echo -e "${YELLOW}[6/8] 配置环境变量...${NC}"

if [ ! -f "backend/.env" ]; then
    echo "生成环境变量文件..."
    cp backend/.env.example backend/.env

    # 生成随机密码
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=')

    # 更新环境变量
    sed -i "s/your-strong-password/$DB_PASSWORD/g" backend/.env
    sed -i "s/your-super-secret-jwt-key-at-least-32-characters/$JWT_SECRET/g" backend/.env

    echo ""
    echo -e "${YELLOW}请配置以下环境变量:${echo}"
    echo "  - ZHIPU_API_KEY (智谱AI密钥)"
    echo "  - QIWEN_API_KEY (通义千问密钥)"
    echo "  - 其他 AI API Keys (可选)"
    echo ""
    read -p "是否现在编辑? (y/n): " EDIT_ENV
    if [[ $EDIT_ENV =~ ^[Yy]$ ]]; then
        ${EDITOR:-vim} backend/.env
    fi

    echo -e "${GREEN}✓ 环境变量已配置${NC}"
else
    echo -e "${GREEN}✓ 环境变量文件已存在${NC}"
fi

# ============================================
# 7. 启动服务
# ============================================
echo -e "${YELLOW}[7/8] 启动服务...${NC}"

# 构建并启动
docker-compose -f docker/docker-compose.low-memory.yml up -d --build

echo -e "${GREEN}✓ 服务已启动${NC}"

# 等待服务启动
echo "等待数据库启动..."
sleep 15

# ============================================
# 8. 运行数据库迁移
# ============================================
echo -e "${YELLOW}[8/8] 运行数据库迁移...${NC}"

docker-compose -f docker/docker-compose.low-memory.yml exec -T backend pnpm db:migrate

echo -e "${GREEN}✓ 数据库迁移完成${NC}"

# ============================================
# 完成
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
docker-compose -f docker/docker-compose.low-memory.yml ps
echo ""
echo -e "${YELLOW}服务管理命令:${NC}"
echo "  查看日志: docker-compose -f docker/docker-compose.low-memory.yml logs -f"
echo "  重启服务: docker-compose -f docker/docker-compose.low-memory.yml restart"
echo "  停止服务: docker-compose -f docker/docker-compose.low-memory.yml down"
echo "  查看状态: docker-compose -f docker/docker-compose.low-memory.yml ps"
echo ""
echo -e "${YELLOW}配置 SSL 证书 (可选):${NC}"
echo "  1. 停止前端: docker-compose -f docker/docker-compose.low-memory.yml stop frontend"
echo "  2. 获取证书: certbot certonly --standalone -d your-domain.com"
echo "  3. 复制证书到 docker/ssl/"
echo "  4. 重启服务: docker-compose -f docker/docker-compose.low-memory.yml start frontend"
echo ""
echo -e "${YELLOW}内存使用情况:${NC}"
free -h
