# Guia de Deploy - Kaniu WebApp no VPS

Este guia fornece instruções passo a passo para fazer o deploy da aplicação Kaniu em um VPS (Virtual Private Server).

## Pré-requisitos

### No seu VPS
- Ubuntu 20.04+ ou Debian 11+ (recomendado)
- Acesso root ou sudo
- Domínio apontado para o IP do VPS (opcional, mas recomendado para SSL)
- Mínimo de 2GB RAM recomendado
- Docker e Docker Compose instalados

## Passo 1: Preparar o VPS

### 1.1 Conectar ao VPS via SSH

```bash
ssh root@seu-ip-vps
# ou
ssh seu-usuario@seu-ip-vps
```

### 1.2 Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Docker

```bash
# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Adicionar usuário ao grupo docker (para não usar sudo)
sudo usermod -aG docker $USER
```

### 1.4 Instalar Docker Compose

```bash
# Baixar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão de execução
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

### 1.5 Instalar Git

```bash
sudo apt install -y git
```

## Passo 2: Configurar o Projeto no VPS

### 2.1 Clonar o repositório

```bash
# Criar diretório para aplicações
mkdir -p ~/apps
cd ~/apps

# Clonar o repositório
git clone https://github.com/seu-usuario/kaniu-webapp.git
cd kaniu-webapp
```

### 2.2 Configurar variáveis de ambiente

```bash
# Copiar o arquivo de exemplo
cp .env.production.example .env

# Editar o arquivo .env
nano .env
```

**Configurações importantes no `.env`:**

```env
# Database - Use uma senha forte!
POSTGRES_USER=kaniu
POSTGRES_PASSWORD=sua_senha_forte_aqui
POSTGRES_DB=kaniu
DATABASE_URL="postgresql://kaniu:sua_senha_forte_aqui@postgres:5432/kaniu"

# NextAuth - Gerar secret com: openssl rand -base64 32
NEXTAUTH_URL=https://seudominio.com  # ou http://seu-ip-vps se não tiver domínio
NEXTAUTH_SECRET=cole_aqui_o_secret_gerado

# Outros serviços (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
EMAIL_FROM=noreply@seudominio.com

NODE_ENV=production
```

**Para gerar o NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2.3 Configurar Nginx (se usar domínio)

Se você tem um domínio, edite o arquivo `nginx/conf.d/default.conf`:

```bash
nano nginx/conf.d/default.conf
```

Substitua `your-domain.com` pelo seu domínio real na seção HTTPS (ainda comentada).

## Passo 3: Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow OpenSSH

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable
```

## Passo 4: Fazer o Deploy

### 4.1 Build e iniciar os containers

```bash
# Build das imagens
docker-compose build

# Iniciar os serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### 4.2 Verificar status dos containers

```bash
docker-compose ps
```

Todos os containers devem estar com status "Up".

### 4.3 Testar a aplicação

Acesse no navegador:
- Sem domínio: `http://seu-ip-vps`
- Com domínio: `http://seudominio.com`

## Passo 5: Configurar SSL com Let's Encrypt (Opcional, mas Recomendado)

### 5.1 Obter certificado SSL

```bash
# Parar o nginx temporariamente
docker-compose stop nginx

# Obter certificado
docker-compose run --rm certbot certonly --standalone \
  --email seu-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d seudominio.com \
  -d www.seudominio.com

# Reiniciar nginx
docker-compose start nginx
```

### 5.2 Ativar configuração HTTPS

```bash
nano nginx/conf.d/default.conf
```

1. Descomentar a seção HTTPS (servidor na porta 443)
2. Comentar a seção de proxy temporária no servidor HTTP (porta 80)
3. Descomentar o redirect para HTTPS
4. Substituir `your-domain.com` pelo seu domínio

```bash
# Reiniciar nginx para aplicar mudanças
docker-compose restart nginx
```

### 5.3 Testar renovação automática

```bash
docker-compose run --rm certbot renew --dry-run
```

## Passo 6: Comandos Úteis

### Gerenciar containers

```bash
# Ver logs
docker-compose logs -f app        # Logs da aplicação
docker-compose logs -f postgres   # Logs do banco de dados
docker-compose logs -f nginx      # Logs do nginx

# Reiniciar serviços
docker-compose restart

# Parar serviços
docker-compose stop

# Parar e remover containers
docker-compose down

# Rebuild após mudanças no código
git pull
docker-compose build
docker-compose up -d
```

### Gerenciar banco de dados

```bash
# Acessar o PostgreSQL
docker-compose exec postgres psql -U kaniu -d kaniu

# Backup do banco de dados
docker-compose exec postgres pg_dump -U kaniu kaniu > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T postgres psql -U kaniu kaniu < backup_20240101.sql

# Ver migrations
docker-compose exec app npx prisma migrate status

# Rodar migrations manualmente (se necessário)
docker-compose exec app npx prisma migrate deploy
```

### Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver espaço em disco
df -h

# Limpar recursos não utilizados do Docker
docker system prune -a
```

## Passo 7: Manutenção e Atualizações

### Atualizar a aplicação

```bash
cd ~/apps/kaniu-webapp

# Baixar últimas mudanças
git pull

# Rebuild e reiniciar
docker-compose build
docker-compose up -d

# Verificar se tudo está funcionando
docker-compose logs -f
```

### Backup automático

Crie um script de backup:

```bash
nano ~/backup-kaniu.sh
```

Adicione:

```bash
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
cd ~/apps/kaniu-webapp
docker-compose exec -T postgres pg_dump -U kaniu kaniu > $BACKUP_DIR/kaniu_$(date +%Y%m%d_%H%M%S).sql
# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "kaniu_*.sql" -mtime +7 -delete
```

Dar permissão e agendar no cron:

```bash
chmod +x ~/backup-kaniu.sh
crontab -e
```

Adicionar linha para backup diário às 2h da manhã:

```
0 2 * * * ~/backup-kaniu.sh
```

## Troubleshooting

### Aplicação não inicia

```bash
# Ver logs detalhados
docker-compose logs

# Verificar se as portas estão em uso
sudo netstat -tulpn | grep -E ':(80|443|3000|5432)'

# Reiniciar do zero
docker-compose down -v
docker-compose up -d
```

### Erro de conexão com banco de dados

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps postgres

# Ver logs do PostgreSQL
docker-compose logs postgres

# Verificar variáveis de ambiente
docker-compose exec app env | grep DATABASE
```

### SSL não funciona

```bash
# Verificar certificados
sudo ls -la ~/apps/kaniu-webapp/certbot/conf/live/

# Testar renovação
docker-compose run --rm certbot renew --dry-run

# Ver logs do nginx
docker-compose logs nginx
```

### Problemas de performance

```bash
# Ver uso de recursos
docker stats

# Verificar espaço em disco
df -h

# Limpar logs antigos do Docker
sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"
```

## Segurança Adicional

### 1. Configurar fail2ban (proteção contra ataques de força bruta)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Desabilitar login root via SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Alterar:
```
PermitRootLogin no
```

Reiniciar SSH:
```bash
sudo systemctl restart sshd
```

### 3. Configurar backups automáticos

Além do backup do banco de dados, considere fazer backup de:
- Arquivos de configuração (.env)
- Certificados SSL
- Volumes do Docker

## Monitoramento (Opcional)

Para monitoramento avançado, você pode adicionar:

- **Portainer**: Interface web para gerenciar Docker
  ```bash
  docker volume create portainer_data
  docker run -d -p 9000:9000 --name portainer --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data portainer/portainer-ce
  ```
  Acesse: `http://seu-ip:9000`

- **Uptime Kuma**: Monitor de uptime
- **Grafana + Prometheus**: Métricas detalhadas

## Custos Estimados

### Opções de VPS

1. **DigitalOcean** - Droplet básico: $6/mês (1GB RAM)
2. **Linode** - Nanode: $5/mês (1GB RAM)
3. **Vultr** - VPS básico: $5/mês (1GB RAM)
4. **Hetzner** - VPS CX11: €4.51/mês (2GB RAM) - Melhor custo-benefício
5. **AWS Lightsail** - $5/mês (1GB RAM)

**Recomendação**: Hetzner CX21 (€6.90/mês, 2GB RAM, 40GB SSD) para melhor performance.

### Custos adicionais

- Domínio: ~$10-15/ano
- SSL: Grátis (Let's Encrypt)
- Backups automáticos: Inclusos ou +$1-2/mês

## Suporte

Para problemas ou dúvidas:
1. Verificar logs: `docker-compose logs`
2. Consultar documentação do Next.js: https://nextjs.org/docs
3. Documentação do Prisma: https://www.prisma.io/docs

## Checklist de Deploy

- [ ] VPS configurado com Docker e Docker Compose
- [ ] Repositório clonado no VPS
- [ ] Arquivo `.env` configurado com senhas fortes
- [ ] `NEXTAUTH_SECRET` gerado e configurado
- [ ] Firewall configurado (portas 80, 443, SSH)
- [ ] Containers rodando: `docker-compose ps`
- [ ] Aplicação acessível via navegador
- [ ] SSL configurado (se usar domínio)
- [ ] Backup automático configurado
- [ ] Logs sendo monitorados

## Próximos Passos

Após o deploy inicial:
1. Configurar domínio personalizado
2. Ativar SSL/HTTPS
3. Configurar backups automáticos
4. Implementar monitoramento
5. Configurar CI/CD para deploys automáticos
6. Otimizar performance (cache, CDN)

---

**Criado**: 2024
**Versão**: 1.0
**Última atualização**: 2024
