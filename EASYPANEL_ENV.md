# Variáveis de Ambiente - Easypanel

## Configuração Necessária

No painel do Easypanel, vá em **Environment Variables** e adicione:

### 1. DATABASE_URL (Obrigatório)
```
DATABASE_URL=postgresql://postgres.hgqhtkgmonshnsuevnoz:[SUA-SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```
**Onde encontrar:** Supabase Dashboard > Project Settings > Database > Connection Pooling

### 2. NEXTAUTH_URL (Obrigatório)
```
NEXTAUTH_URL=https://seu-dominio.com
```
**Substitua** `seu-dominio.com` pelo domínio real do Easypanel

### 3. NEXTAUTH_SECRET (Obrigatório)
Gere um segredo aleatório com:
```bash
openssl rand -base64 32
```

Ou use este exemplo (GERE UM NOVO EM PRODUÇÃO):
```
NEXTAUTH_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres
```

### 4. NODE_ENV (Opcional - Easypanel já define)
```
NODE_ENV=production
```

## Após Configurar as Variáveis:

1. Salve as variáveis no Easypanel
2. Rebuild o serviço (ou faça redeploy)
3. O container será reconstruído com o OpenSSL instalado
4. O Prisma conseguirá conectar ao banco de dados

## Verificar Logs

Após o redeploy, verifique os logs do Easypanel. Você deve ver:
```
✓ Ready in XXXms
```

Se ver erros de conexão com banco, verifique:
- DATABASE_URL está correta
- IP do servidor VPS está permitido no Supabase
- Porta 6543 (pooler) ou 5432 (direct) está acessível
