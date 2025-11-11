# Kaniu - Sistema de Gestão de Abrigos de Animais

Sistema completo para gestão de abrigos e processos de adoção de animais.

## Stack Tecnológica

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: NextAuth.js

## Começando

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd kaniu-webapp
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais.

4. Configure o banco de dados:
```bash
# Execute o schema SQL
psql -U seu_usuario -d kaniu < database/schema.sql

# Ou use Prisma (após criar o banco)
npm run db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria o build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run db:generate` - Gera o Prisma Client
- `npm run db:push` - Sincroniza o schema com o banco
- `npm run db:studio` - Abre o Prisma Studio
- `npm run db:seed` - Popula o banco com dados iniciais

## Estrutura do Projeto

```
kaniu-webapp/
├── src/
│   ├── app/              # App Router do Next.js
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários e configurações
│   ├── hooks/            # Custom hooks
│   └── types/            # TypeScript types
├── prisma/               # Schema do Prisma
├── database/             # Schema SQL original
└── public/               # Arquivos estáticos
```

## Deploy em Produção

### 🚀 Deploy Rápido com Easypanel (Recomendado)

A forma mais rápida de colocar a aplicação online:

1. Instale o Easypanel no seu VPS:
```bash
curl -sSL https://get.easypanel.io | sh
```

2. Siga o guia de 5 minutos: **[EASYPANEL-QUICKSTART.md](./EASYPANEL-QUICKSTART.md)**

**Recursos inclusos:**
- ✅ SSL/HTTPS automático
- ✅ Deploy via Git
- ✅ Backup automático
- ✅ Monitoramento
- ✅ Zero configuração de servidor

### 🐳 Deploy com Docker

Para deploy manual ou em outros ambientes:

```bash
# Build e start
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 📚 Guias de Deploy

- **[EASYPANEL-QUICKSTART.md](./EASYPANEL-QUICKSTART.md)** - Deploy em 5 minutos com Easypanel
- **[EASYPANEL.md](./EASYPANEL.md)** - Guia completo do Easypanel
- **[DEPLOY.md](./DEPLOY.md)** - Deploy manual em VPS com Docker
- **[scripts/README.md](./scripts/README.md)** - Scripts de automação

### 💰 Custos Estimados

- **VPS**: €7-12/mês (Hetzner, DigitalOcean, etc)
- **Easypanel**: Grátis (self-hosted)
- **Domínio**: $10-15/ano
- **SSL**: Grátis (Let's Encrypt)

**Total**: ~€10/mês

## Plano de Desenvolvimento

Veja o arquivo [PLANO.md](PLANO.md) para o roadmap completo do projeto.

## Licença

MIT
