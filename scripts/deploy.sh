#!/bin/bash

# Script de Deploy para Kaniu WebApp
# Usage: ./scripts/deploy.sh

set -e  # Exit on error

echo "🚀 Iniciando deploy do Kaniu WebApp..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erro: docker-compose.yml não encontrado!${NC}"
    echo "Execute este script do diretório raiz do projeto."
    exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado!${NC}"
    echo "Copiando .env.production.example para .env..."
    cp .env.production.example .env
    echo -e "${YELLOW}⚠️  Configure o arquivo .env antes de continuar!${NC}"
    echo "Execute: nano .env"
    exit 1
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    echo "Instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado!${NC}"
    echo "Instale o Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Verificações iniciais concluídas${NC}"

# Pull latest changes (se for atualização)
if [ -d ".git" ]; then
    echo "📥 Baixando últimas mudanças..."
    git pull
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Build das imagens
echo "🔨 Building imagens Docker..."
docker-compose build --no-cache

# Iniciar containers
echo "🎬 Iniciando containers..."
docker-compose up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verificar status
echo "📊 Verificando status dos containers..."
docker-compose ps

# Verificar logs
echo ""
echo "📝 Últimas linhas dos logs:"
docker-compose logs --tail=20

# Verificar se app está rodando
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
    echo ""
    echo "📍 Sua aplicação está rodando em:"
    echo "   - Local: http://localhost:3000"
    echo "   - Com Nginx: http://localhost"
    echo ""
    echo "💡 Comandos úteis:"
    echo "   - Ver logs: docker-compose logs -f"
    echo "   - Parar: docker-compose stop"
    echo "   - Reiniciar: docker-compose restart"
    echo "   - Ver status: docker-compose ps"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Erro no deploy!${NC}"
    echo "Verifique os logs: docker-compose logs"
    exit 1
fi
