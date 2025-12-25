#!/bin/bash

# ============================================
# AI 内容生成平台 - 国内服务器一键部署脚本
# 适用于中国大陆服务器
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AI 内容生成平台 - 国内服务器部署${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 检测系统类型
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}无法检测系统类型${NC}"
    exit 1
fi

echo -e "${GREEN}检测到系统: $OS${NC}"
echo ""

# ============================================
# 1. 安装 Docker（国内镜像）
# ============================================
echo -e "${YELLOW}[1/8] 安装 Docker...${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker 已安装${NC}"
else
    echo "使用国内镜像安装 Docker..."

    case $OS in
        alinux|centos|rhel)
            # 阿里云 Linux / CentOS
            echo "安装 Docker (YUM)..."

            # 配置阿里云镜像源
            yum install -y yum-utils
            yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

            # 安装
            yum install -y docker-ce docker-ce-cli containerd.io

            # 配置 Docker 镜像加速器
            mkdir -p /etc/docker
            cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
            ;;

        ubuntu|debian)
            # Ubuntu / Debian
            echo "安装 Docker (APT)..."

            # 更新并安装依赖
            apt-get update
            apt-get install -y ca-certificates curl gnupg

            # 添加 Docker GPG 密钥（使用阿里云镜像）
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            chmod a+r /etc/apt/keyrings/docker.gpg

            # 设置仓库
            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu \
              "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
              tee /etc/apt/sources.list.d/docker.list > /dev/null

            # 安装
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io

            # 配置 Docker 镜像加速器
            mkdir -p /etc/docker
            cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
            ;;

        *)
            echo -e "${RED}不支持的系统: $OS${NC}"
            echo "请手动安装 Docker"
            exit 1
            ;;
    esac

    # 启动 Docker
    systemctl daemon-reload
    systemctl enable docker
    systemctl start docker

    echo -e "${GREEN}✓ Docker 安装完成${NC}"
fi

# 验证 Docker
docker --version

# ============================================
# 2. 安装 Docker Compose
# ============================================
echo -e "${YELLOW}[2/8] 安装 Docker Compose...${NC}"

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
else
    echo "从 GitHub 下载 Docker Compose..."

    # 使用国内加速
    DOCKER_COMPOSE_VERSION="v2.24.5"

    curl -L "https://gh-proxy.com/https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

    # 如果上面失败，尝试其他镜像
    if [ ! -f /usr/local/bin/docker-compose ] || [ ! -s /usr/local/bin/docker-compose ]; then
        curl -L "https://gh.llkk.cc/https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    fi

    chmod +x /usr/local/bin/docker-compose

    # 创建软链接
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
fi

docker-compose --version

# ============================================
# 3. 配置 Swap
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
    echo -e "${YELLOW}⚠ 未检测到防火墙${NC}"
fi

echo ""
echo -e "${RED}重要: 请确保在阿里云控制台配置安全组规则！${NC}"
echo -e "${RED}需要开放端口: 80 (HTTP), 443 (HTTPS)${NC}"
echo ""

# ============================================
# 5. 准备项目目录
# ============================================
echo -e "${YELLOW}[5/8] 准备项目目录...${NC}"

PROJECT_DIR="/root/workspace/aipostBlog"
cd $PROJECT_DIR

if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}错误: 未找到项目文件${NC}"
    echo "请确保项目代码在 $PROJECT_DIR"
    exit 1
fi

echo -e "${GREEN}✓ 项目目录确认${NC}"

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
    echo -e "${YELLOW}请配置 AI API Keys:${NC}"
    echo "需要配置的密钥 (至少一个):"
    echo "  - ZHIPU_API_KEY (智谱AI - 推荐，有免费额度)"
    echo "  - QIWEN_API_KEY (通义千问)"
    echo ""
    read -p "是否现在编辑配置文件? (y/n): " EDIT_ENV
    if [[ $EDIT_ENV =~ ^[Yy]$ ]]; then
        ${EDITOR:-vim} backend/.env
    fi

    echo -e "${GREEN}✓ 环境变量已配置${NC}"
else
    echo -e "${GREEN}✓ 环境变量文件已存在${NC}"
fi

# ============================================
# 7. 拉取镜像并构建
# ============================================
echo -e "${YELLOW}[7/8] 拉取 Docker 镜像...${NC}"

echo "拉取基础镜像..."
docker pull postgres:16-alpine
docker pull redis:7-alpine
docker pull node:20-alpine

echo -e "${GREEN}✓ 镜像拉取完成${NC}"

# ============================================
# 8. 启动服务
# ============================================
echo -e "${YELLOW}[8/8] 启动服务...${NC}"

# 构建并启动
docker-compose -f docker/docker-compose.low-memory.yml up -d --build

echo -e "${GREEN}✓ 服务已启动${NC}"

# 等待服务启动
echo "等待数据库启动..."
sleep 20

# 运行数据库迁移
echo "运行数据库迁移..."
docker-compose -f docker/docker-compose.low-memory.yml exec -T backend pnpm db:migrate || echo "迁移可能已运行或稍后手动执行"

# ============================================
# 完成
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}服务状态:${NC}"
docker-compose -f docker/docker-compose.low-memory.yml ps
echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo "  HTTP:  http://$(curl -s ifconfig.me)"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "  查看日志: docker-compose -f docker/docker-compose.low-memory.yml logs -f"
echo "  重启服务: docker-compose -f docker/docker-compose.low-memory.yml restart"
echo "  停止服务: docker-compose -f docker/docker-compose.low-memory.yml down"
echo "  进入后端: docker-compose -f docker/docker-compose.low-memory.yml exec backend sh"
echo ""
echo -e "${YELLOW}内存使用情况:${NC}"
free -h
