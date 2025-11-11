#!/bin/bash

# Script de Setup Inicial do VPS para Kaniu WebApp
# Usage: curl -fsSL https://raw.githubusercontent.com/seu-usuario/kaniu-webapp/main/scripts/setup-vps.sh | bash
# ou: wget -qO- https://raw.githubusercontent.com/seu-usuario/kaniu-webapp/main/scripts/setup-vps.sh | bash

set -e  # Exit on error

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   Kaniu WebApp - VPS Setup Script    ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Este script precisa ser executado como root ou com sudo${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Iniciando configuração do VPS...${NC}"
echo ""

# 1. Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

# 2. Instalar dependências básicas
echo -e "${YELLOW}📦 Instalando dependências básicas...${NC}"
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    nano \
    wget \
    ufw

# 3. Instalar Docker
echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Adicionar chave GPG do Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Adicionar repositório do Docker
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Instalar Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io

    # Iniciar e habilitar Docker
    systemctl start docker
    systemctl enable docker

    echo -e "${GREEN}✓ Docker instalado com sucesso!${NC}"
else
    echo -e "${GREEN}✓ Docker já está instalado${NC}"
fi

# 4. Instalar Docker Compose
echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose instalado com sucesso!${NC}"
else
    echo -e "${GREEN}✓ Docker Compose já está instalado${NC}"
fi

# 5. Adicionar usuário ao grupo docker (se não for root)
if [ -n "$SUDO_USER" ]; then
    echo -e "${YELLOW}👤 Adicionando usuário ao grupo docker...${NC}"
    usermod -aG docker $SUDO_USER
    echo -e "${GREEN}✓ Usuário adicionado ao grupo docker${NC}"
    echo -e "${YELLOW}⚠️  Faça logout e login novamente para aplicar as mudanças${NC}"
fi

# 6. Configurar Firewall
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
# Permitir SSH (importante fazer antes de ativar o firewall!)
ufw allow OpenSSH
ufw allow 22/tcp
# Permitir HTTP e HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
# Ativar firewall
ufw --force enable
echo -e "${GREEN}✓ Firewall configurado${NC}"

# 7. Criar diretório para aplicações
echo -e "${YELLOW}📁 Criando diretório para aplicações...${NC}"
mkdir -p /opt/apps
cd /opt/apps

# 8. Instalar fail2ban (proteção contra ataques)
echo -e "${YELLOW}🛡️  Instalando fail2ban...${NC}"
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
echo -e "${GREEN}✓ Fail2ban instalado e ativado${NC}"

# 9. Configurar timezone
echo -e "${YELLOW}🌍 Configurando timezone...${NC}"
timedatectl set-timezone America/Sao_Paulo
echo -e "${GREEN}✓ Timezone configurado para America/Sao_Paulo${NC}"

# 10. Otimizações de sistema
echo -e "${YELLOW}⚙️  Aplicando otimizações de sistema...${NC}"
# Aumentar limites de arquivo
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
EOF

# Otimizações de rede
cat >> /etc/sysctl.conf << EOF
# Network optimizations
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.ip_local_port_range = 1024 65535
EOF
sysctl -p

echo -e "${GREEN}✓ Otimizações aplicadas${NC}"

# Verificar instalações
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup concluído com sucesso!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "📋 Versões instaladas:"
echo "   - Docker: $(docker --version)"
echo "   - Docker Compose: $(docker-compose --version)"
echo "   - Git: $(git --version)"
echo ""
echo "📍 Próximos passos:"
echo ""
echo "1. Clone o repositório:"
echo "   cd /opt/apps"
echo "   git clone https://github.com/seu-usuario/kaniu-webapp.git"
echo "   cd kaniu-webapp"
echo ""
echo "2. Configure as variáveis de ambiente:"
echo "   cp .env.production.example .env"
echo "   nano .env"
echo ""
echo "3. Gere o NEXTAUTH_SECRET:"
echo "   openssl rand -base64 32"
echo ""
echo "4. Execute o deploy:"
echo "   chmod +x scripts/deploy.sh"
echo "   ./scripts/deploy.sh"
echo ""
echo "5. (Opcional) Configure SSL com Let's Encrypt"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Se adicionou usuário ao grupo docker, faça logout e login novamente!${NC}"
echo ""
