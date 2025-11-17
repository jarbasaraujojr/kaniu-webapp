# Deploy do Kaniu WebApp no Easypanel

Guia completo para fazer deploy da aplicação Kaniu usando Easypanel.

## 📋 O que é Easypanel?

Easypanel é uma interface moderna e intuitiva para gerenciar aplicações Docker em VPS. Ele simplifica:
- Deploy de aplicações
- Gerenciamento de domínios e SSL
- Backups automáticos
- Monitoramento
- Proxy reverso automático (Traefik)

## 🚀 Passo 1: Preparar o VPS com Easypanel

### 1.1 Requisitos do VPS

- Ubuntu 20.04+ ou Debian 11+
- Mínimo 2GB RAM (recomendado)
- 20GB de espaço em disco
- Acesso root via SSH

### 1.2 Instalar Easypanel

Conecte ao seu VPS via SSH e execute:

```bash
curl -sSL https://get.easypanel.io | sh
```

Aguarde a instalação (leva cerca de 5 minutos).

### 1.3 Acessar o Easypanel

Após a instalação, acesse:
```
http://seu-ip-vps:3000
```

Crie sua conta de administrador.

## 📦 Passo 2: Criar a Aplicação no Easypanel

### 2.1 Criar um Novo Projeto

1. No Easypanel, clique em **"+ Create Project"**
2. Nome: `kaniu-webapp`
3. Clique em **"Create"**

### 2.2 Adicionar Serviço PostgreSQL

1. Dentro do projeto, clique em **"+ Add Service"**
2. Selecione **"PostgreSQL"** (ou "Database" > "PostgreSQL")
3. Configure:
   - **Name**: `postgres`
   - **Database Name**: `kaniu`
   - **Username**: `kaniu`
   - **Password**: Gere uma senha forte (salve em local seguro!)
   - **Version**: `16` (ou a mais recente)
4. Clique em **"Create"**

Aguarde o PostgreSQL iniciar (status verde).

### 2.3 Adicionar Aplicação Next.js

#### Opção A: Via Git (Recomendado)

1. No projeto, clique em **"+ Add Service"**
2. Selecione **"App"** ou **"Custom"**
3. Escolha **"From Git"**
4. Configure:

**General:**
- **Name**: `app`
- **Git Repository**: `https://github.com/jarbasaraujojr/kaniu-webapp`
- **Branch**: `main` (ou a branch desejada)
- **Build Method**: `Dockerfile`
- **Dockerfile Path**: `Dockerfile`

**Domains:**
- Clique em **"+ Add Domain"**
- **Domain**: `seu-dominio.com` (ou use o domínio fornecido pelo Easypanel)
- **Enable SSL**: ✅ (Easypanel configura automaticamente)

**Environment Variables:**
Adicione as seguintes variáveis:

```env
# Database
DATABASE_URL=postgresql://kaniu:SUA_SENHA@postgres:5432/kaniu

# NextAuth (IMPORTANTE!)
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=cole_aqui_o_secret_gerado

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary (opcional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (opcional)
RESEND_API_KEY=
EMAIL_FROM=noreply@seu-dominio.com

# Environment
NODE_ENV=production
```

**Para gerar o NEXTAUTH_SECRET**, execute no seu computador:
```bash
openssl rand -base64 32
```

**Port Mapping:**
- **Container Port**: `3000`
- **Enable External Access**: ✅

**Deploy:**
- **Auto Deploy**: ✅ (para deploys automáticos no git push)

5. Clique em **"Create"**

O Easypanel vai:
- Clonar o repositório
- Fazer build do Dockerfile
- Iniciar a aplicação
- Configurar SSL automaticamente

#### Opção B: Via Docker Compose

1. No projeto, clique em **"+ Add Service"**
2. Selecione **"Docker Compose"**
3. Cole o conteúdo do arquivo `docker-compose.easypanel.yml`
4. Configure as variáveis de ambiente
5. Clique em **"Create"**

### 2.4 Verificar Logs

1. Clique no serviço **"app"**
2. Vá para a aba **"Logs"**
3. Verifique se não há erros

Procure por:
```
✓ Ready on http://0.0.0.0:3000
```

### 2.5 Configurar Domínio (Opcional)

Se você tem um domínio próprio:

1. No seu provedor de domínio (GoDaddy, Namecheap, etc), adicione:
   - Tipo: `A`
   - Nome: `@` (ou `www`)
   - Valor: IP do seu VPS
   - TTL: `3600`

2. No Easypanel, no serviço **app**:
   - Vá em **"Domains"**
   - Clique em **"+ Add Domain"**
   - Digite: `seu-dominio.com`
   - **Enable SSL**: ✅
   - Clique em **"Save"**

O Easypanel vai:
- Configurar o Traefik (proxy reverso)
- Gerar certificado SSL via Let's Encrypt
- Redirecionar HTTP para HTTPS automaticamente

## 🔧 Passo 3: Configurações Pós-Deploy

### 3.1 Executar Migrations

1. Clique no serviço **"app"**
2. Vá para a aba **"Terminal"** ou **"Console"**
3. Execute:

```bash
npx prisma migrate deploy
```

### 3.2 Seed do Banco de Dados (Opcional)

Se você tem dados iniciais:

```bash
npm run db:seed
```

### 3.3 Criar Usuário Admin

No terminal do serviço app:

```bash
npx prisma studio
```

Ou conecte diretamente ao banco via Easypanel.

## 📊 Passo 4: Monitoramento e Manutenção

### 4.1 Ver Logs

**Easypanel UI:**
1. Clique no serviço
2. Aba **"Logs"**
3. Logs em tempo real

**Via Terminal:**
```bash
# No VPS
docker logs -f <container-id>
```

### 4.2 Reiniciar Serviços

**Via Easypanel:**
1. Clique no serviço
2. Botão **"Restart"**

**Via Terminal:**
```bash
docker restart <container-name>
```

### 4.3 Backup Automático

**Configurar no Easypanel:**
1. Clique no serviço **postgres**
2. Vá em **"Backups"**
3. Clique em **"+ Add Backup"**
4. Configure:
   - **Schedule**: `0 2 * * *` (diário às 2h)
   - **Retention**: `7` (dias)
5. Salve

**Backup Manual:**
1. Clique no serviço **postgres**
2. Botão **"Backup Now"**

### 4.4 Escalar Recursos

Se precisar de mais recursos:
1. Clique no serviço
2. Aba **"Resources"**
3. Ajuste:
   - **CPU Limit**
   - **Memory Limit**
4. Salve e reinicie

## 🔄 Passo 5: Atualizações

### 5.1 Atualização Automática (com Auto Deploy)

Se habilitou **Auto Deploy**:
1. Faça commit e push no seu repositório
2. Easypanel detecta automaticamente
3. Faz rebuild e redeploy

### 5.2 Atualização Manual

**Via Easypanel:**
1. Clique no serviço **app**
2. Botão **"Rebuild"** ou **"Redeploy"**
3. Aguarde o build

**Via Git:**
1. Vá em **"Settings"** do serviço
2. Clique em **"Trigger Deploy"**

## 🔐 Segurança

### 5.1 Variáveis de Ambiente Sensíveis

✅ O Easypanel já protege as variáveis de ambiente
✅ SSL/HTTPS configurado automaticamente
✅ Firewall gerenciado automaticamente

### 5.2 Senhas Fortes

Use senhas fortes para:
- ✅ `POSTGRES_PASSWORD`
- ✅ `NEXTAUTH_SECRET`
- ✅ Senha do Easypanel

### 5.3 Backup

Configure backups automáticos:
- ✅ Banco de dados: diário
- ✅ Volumes: semanal

## 📈 Monitoramento Avançado

### 6.1 Métricas no Easypanel

O Easypanel fornece:
- CPU usage
- Memory usage
- Network traffic
- Disk space

Acesse em: **Dashboard** > **Project** > **Metrics**

### 6.2 Alertas (Opcional)

Configure alertas para:
- Alto uso de CPU/memória
- Erros na aplicação
- Downtime

## 🐛 Troubleshooting

### Aplicação não inicia

**Verificar:**
1. Logs do serviço (aba Logs)
2. Variáveis de ambiente configuradas corretamente
3. PostgreSQL está rodando (status verde)

**Solução:**
```bash
# Ver logs detalhados
docker logs -f app

# Verificar variáveis
docker exec app env | grep DATABASE
```

### Erro de conexão com banco

**Verificar:**
1. `DATABASE_URL` está correto
2. PostgreSQL está acessível
3. Senha está correta

**Solução:**
1. No Easypanel, vá no PostgreSQL
2. Copie a **Connection String**
3. Cole no `DATABASE_URL` da app

### SSL não funciona

**Verificar:**
1. Domínio está apontado para o IP correto
2. Aguardar propagação DNS (até 24h)
3. Porta 443 está aberta

**Solução:**
1. No serviço, vá em **Domains**
2. Clique em **"Renew SSL"**
3. Aguarde alguns minutos

### Build falha

**Verificar logs do build:**
1. Aba **"Builds"**
2. Ver último build
3. Verificar erros

**Soluções comuns:**
```bash
# Limpar cache do Docker
# No Easypanel: Settings > Advanced > Clear Build Cache

# Verificar Dockerfile
# Testar build localmente
docker build -t kaniu-test .
```

## 💰 Custos

### Easypanel
- **Gratuito** para uso pessoal
- **Self-hosted** no seu próprio VPS

### VPS (custo mensal)
- **Hetzner CX21**: €6.90/mês (2GB RAM) ⭐ Recomendado
- **DigitalOcean**: $12/mês (2GB RAM)
- **Linode**: $12/mês (2GB RAM)
- **Vultr**: $12/mês (2GB RAM)

### Custos adicionais
- Domínio: ~$10-15/ano
- SSL: Grátis (Let's Encrypt)

**Total estimado: ~€7-12/mês + domínio**

## ✅ Checklist de Deploy

- [ ] VPS configurado com Easypanel
- [ ] Projeto criado no Easypanel
- [ ] PostgreSQL criado e rodando
- [ ] Aplicação criada via Git
- [ ] Variáveis de ambiente configuradas
- [ ] `NEXTAUTH_SECRET` gerado
- [ ] Domínio configurado (opcional)
- [ ] SSL ativado
- [ ] Migrations executadas
- [ ] Aplicação acessível via browser
- [ ] Logs sem erros
- [ ] Backup automático configurado
- [ ] Auto deploy ativado

## 🎯 Recursos do Easypanel

### Inclusos automaticamente:
- ✅ Proxy reverso (Traefik)
- ✅ SSL/HTTPS automático
- ✅ Gerenciamento de domínios
- ✅ Backups
- ✅ Monitoramento
- ✅ Terminal/Console
- ✅ Logs em tempo real
- ✅ Deploy via Git
- ✅ Auto deploy (webhooks)
- ✅ Rollback de versões

## 📚 Recursos Adicionais

### Documentação Oficial
- **Easypanel**: https://easypanel.io/docs
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs

### Comunidade
- Discord do Easypanel
- GitHub Issues

## 🔗 Links Úteis

- **Easypanel Dashboard**: `http://seu-ip:3000`
- **Sua Aplicação**: `https://seu-dominio.com`
- **Portainer** (se instalado): `http://seu-ip:9000`

## 📝 Exemplo de Configuração Completa

### Estrutura no Easypanel:

```
📁 kaniu-webapp (Project)
  ├── 🗄️ postgres (Service)
  │   ├── Type: PostgreSQL 16
  │   ├── Port: 5432
  │   ├── Volume: postgres_data
  │   └── Backups: Diário
  │
  └── 🚀 app (Service)
      ├── Type: App
      ├── Source: GitHub
      ├── Port: 3000
      ├── Domain: kaniu.seu-dominio.com
      ├── SSL: Enabled
      ├── Auto Deploy: Enabled
      └── Env Variables: 9 variables
```

## 🎉 Pronto!

Sua aplicação Kaniu agora está rodando no Easypanel com:
- ✅ Deploy automático via Git
- ✅ SSL/HTTPS configurado
- ✅ Banco de dados PostgreSQL
- ✅ Backup automático
- ✅ Monitoramento em tempo real
- ✅ Escalabilidade fácil

## 💡 Próximos Passos

1. Configurar email para notificações
2. Adicionar mais recursos (Redis, Object Storage)
3. Configurar CI/CD avançado
4. Implementar staging environment
5. Configurar CDN (Cloudflare)

---

**Versão**: 1.0
**Última atualização**: 2024
**Suporte**: Consulte a documentação oficial do Easypanel
