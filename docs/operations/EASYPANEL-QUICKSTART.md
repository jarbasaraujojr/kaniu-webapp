# 🚀 Kaniu WebApp - Quick Start com Easypanel

Deploy rápido em 5 minutos usando Supabase + Easypanel!

## ⚡ Método Rápido

### 1️⃣ Preparar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Seu projeto já está criado (você já está usando)
3. Copie a **Connection String**:
   - Dashboard → **Project Settings** → **Database**
   - Scroll até **Connection String** → **URI**
   - Copie o valor (será algo como):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```
   - ⚠️ Substitua `[YOUR-PASSWORD]` pela sua senha do Supabase

### 2️⃣ Instalar Easypanel no VPS

```bash
curl -sSL https://get.easypanel.io | sh
```

Acesse: `http://seu-ip-vps:3000`

### 3️⃣ Criar App Next.js no Easypanel

1. **Create Project** → Nome: `kaniu-webapp`

2. **Add Service** → **App** → **From Git**:
   - **Repository**: `https://github.com/jarbasaraujojr/kaniu-webapp`
   - **Branch**: `main` (ou sua branch)
   - **Build Method**: `Dockerfile`
   - **Port**: `3000`

3. **Environment Variables** (copie e cole):

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=GERAR_COM_COMANDO_ABAIXO
```

**⚠️ IMPORTANTE:**
- Substitua `DATABASE_URL` pela connection string do Supabase (passo 1)
- Substitua `seu-dominio.com` pelo seu domínio (ou use o domínio fornecido pelo Easypanel)

**Gerar NEXTAUTH_SECRET** (no seu computador):
```bash
openssl rand -base64 32
```

**Variáveis opcionais** (Google OAuth, Cloudinary, Email):
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
EMAIL_FROM=noreply@seu-dominio.com
```

4. **Domain**:
   - Add domain: `seu-dominio.com`
   - Enable SSL: ✅ (automático!)

5. **Deploy** → **Auto Deploy**: ✅

### 4️⃣ Pronto! 🎉

Aguarde o build (2-3 minutos) e acesse sua aplicação!

O Easypanel vai automaticamente:
- ✅ Clonar o repositório
- ✅ Fazer build do Dockerfile
- ✅ Executar `prisma migrate deploy` (atualiza o Supabase)
- ✅ Configurar SSL/HTTPS
- ✅ Iniciar a aplicação

## 📊 Configuração de Domínio

No seu provedor de domínio, adicione:

```
Type: A
Name: @
Value: IP_DO_SEU_VPS
TTL: 3600
```

Aguarde propagação DNS (até 24h, geralmente 15 minutos).

## 🔧 Verificar Deploy

### Ver Logs
No Easypanel: **App** → **Logs**

Procure por:
```
✓ Ready on http://0.0.0.0:3000
```

### Testar Conexão com Supabase
No terminal do Easypanel (App → Terminal):

```bash
# Testar conexão
npx prisma db execute --stdin <<< "SELECT 1"

# Ver status das migrations
npx prisma migrate status
```

### Acessar Aplicação
- Via domínio: `https://seu-dominio.com`
- Via IP: `http://seu-ip-vps` (antes do SSL)

## ❓ Problemas Comuns

### App não inicia
**Verificar:**
- Logs no Easypanel
- `DATABASE_URL` está correto
- Supabase está acessível

**Solução:**
```bash
# No terminal do Easypanel
env | grep DATABASE_URL
```

### Erro de conexão com Supabase
**Verificar:**
- Connection string está correta
- Senha do Supabase está correta
- IP do VPS está na whitelist do Supabase (se configurado)

**Solução no Supabase:**
1. Dashboard → **Settings** → **Database**
2. **Connection Pooling** → Desabilitar SSL se necessário
3. Ou use **Connection Pooling** string ao invés de **Direct Connection**

### Migrations não executam
**No terminal do Easypanel:**
```bash
# Forçar deploy das migrations
npx prisma migrate deploy

# Ver detalhes
npx prisma migrate status
```

### SSL não funciona
- Confirmar que domínio aponta para o IP correto
- Aguardar propagação DNS (até 24h)
- No Easypanel: **Domain** → **Renew SSL**

## 🔄 Atualizações

Com **Auto Deploy** ativado:
1. Faça commit e push no seu repositório
2. Easypanel detecta automaticamente
3. Faz rebuild e redeploy

## 📚 Documentação Completa

Consulte **[EASYPANEL.md](./EASYPANEL.md)** para guia detalhado.

## 💰 Custos

- **Supabase**: Grátis (até 500MB DB, 2GB bandwidth/mês)
- **Easypanel**: Grátis (self-hosted)
- **VPS**: €7-12/mês
- **Domínio**: $10-15/ano
- **SSL**: Grátis (Let's Encrypt)

**Total: ~€10/mês**

## ✅ Checklist

- [ ] Connection string do Supabase copiada
- [ ] Easypanel instalado
- [ ] Projeto criado
- [ ] App criada via Git
- [ ] `DATABASE_URL` configurada (Supabase)
- [ ] `NEXTAUTH_SECRET` gerado
- [ ] `NEXTAUTH_URL` configurada
- [ ] Domínio configurado (opcional)
- [ ] SSL ativado
- [ ] Build concluído (sem erros)
- [ ] Migrations executadas
- [ ] App acessível

## 🎯 Estrutura Final

```
Easypanel (VPS)
├── kaniu-webapp (Project)
    └── app (Service)
        ├── Source: GitHub
        ├── Port: 3000
        ├── Domain: seu-dominio.com
        ├── SSL: Enabled
        └── Database: Supabase (externo)
```

## 💡 Dicas

### Backup
O backup do banco de dados é feito automaticamente pelo Supabase!
- Supabase mantém backups diários
- Acesse: Dashboard → **Database** → **Backups**

### Monitoramento
- **Easypanel**: CPU, RAM, Logs da aplicação
- **Supabase**: Queries, Connections, Storage

### Performance
Para melhor performance, considere:
- **Connection Pooling** no Supabase (Transaction mode)
- Usar a connection string de pooling ao invés da direta

---

**Tempo estimado**: 5-10 minutos
**Dificuldade**: ⭐ Fácil

Dúvidas? Consulte:
- [EASYPANEL.md](./EASYPANEL.md) - Guia completo do Easypanel
- [Supabase Docs](https://supabase.com/docs) - Documentação do Supabase
