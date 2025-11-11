# 🚀 Kaniu WebApp - Quick Start com Easypanel

Deploy rápido em 5 minutos!

## ⚡ Método Rápido

### 1️⃣ Instalar Easypanel no VPS

```bash
curl -sSL https://get.easypanel.io | sh
```

Acesse: `http://seu-ip-vps:3000`

### 2️⃣ Criar PostgreSQL

1. **Create Project** → Nome: `kaniu-webapp`
2. **Add Service** → **PostgreSQL**
   - Name: `postgres`
   - Database: `kaniu`
   - Username: `kaniu`
   - Password: **[senha forte]** ⚠️ Salve isso!

### 3️⃣ Criar App Next.js

1. **Add Service** → **App**
2. **From Git**:
   - Repository: `https://github.com/jarbasaraujojr/kaniu-webapp`
   - Branch: `main`
   - Build: `Dockerfile`

3. **Environment Variables** (copie e cole):

```env
NODE_ENV=production
DATABASE_URL=postgresql://kaniu:SUA_SENHA@postgres:5432/kaniu
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=GERAR_COM_COMANDO_ABAIXO
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
EMAIL_FROM=noreply@seu-dominio.com
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

4. **Domain**:
   - Add domain: `seu-dominio.com`
   - Enable SSL: ✅

5. **Port**: `3000`

6. **Deploy** → **Auto Deploy**: ✅

### 4️⃣ Pronto! 🎉

Aguarde o build (2-3 minutos) e acesse sua aplicação!

## 📊 Configuração de Domínio

No seu provedor de domínio, adicione:

```
Type: A
Name: @
Value: IP_DO_SEU_VPS
TTL: 3600
```

Aguarde até 24h para propagação DNS.

## 🔧 Comandos Úteis

### Ver Logs
No Easypanel: App → Logs

### Reiniciar
No Easypanel: App → Restart

### Backup
PostgreSQL → Backups → Backup Now

### Terminal
App → Terminal

```bash
# Ver status das migrations
npx prisma migrate status

# Rodar seed (dados iniciais)
npm run db:seed
```

## ❓ Problemas Comuns

### App não inicia
- Verificar logs no Easypanel
- Confirmar que PostgreSQL está rodando (status verde)
- Verificar `DATABASE_URL` e `NEXTAUTH_SECRET`

### Erro 502
- Build ainda em andamento (aguardar)
- Verificar logs de build

### SSL não funciona
- Confirmar que domínio aponta para o IP correto
- Aguardar propagação DNS (até 24h)
- No Easypanel: Domain → Renew SSL

## 📚 Documentação Completa

Consulte **[EASYPANEL.md](./EASYPANEL.md)** para guia detalhado.

## 💰 Custos

- **Easypanel**: Grátis
- **VPS**: €7-12/mês
- **Domínio**: $10-15/ano
- **SSL**: Grátis (Let's Encrypt)

**Total: ~€10/mês**

## ✅ Checklist

- [ ] Easypanel instalado
- [ ] PostgreSQL criado
- [ ] Senha do PostgreSQL salva
- [ ] App criada via Git
- [ ] Variáveis de ambiente configuradas
- [ ] `NEXTAUTH_SECRET` gerado
- [ ] Domínio configurado
- [ ] SSL ativado
- [ ] Build concluído
- [ ] App acessível

---

**Tempo estimado**: 5-10 minutos
**Dificuldade**: ⭐ Fácil

Dúvidas? Consulte [EASYPANEL.md](./EASYPANEL.md) para mais detalhes.
