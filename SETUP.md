# 🚀 Setup do Projeto Kaniu

## ✅ O que já foi implementado

### Fase 1: Configuração Base (CONCLUÍDA)
- ✅ Arquivo `.env` criado com variáveis de ambiente
- ✅ Prisma Client gerado e configurado
- ✅ Arquivo de seed criado (`prisma/seed.ts`) com:
  - 5 roles (admin, shelter_manager, veterinarian, adopter, volunteer)
  - Catálogos de espécies (Cão, Gato)
  - Raças comuns para cães e gatos
  - Tamanhos (Pequeno, Médio, Grande, Gigante)
  - 3 usuários de exemplo
  - 2 abrigos de exemplo
  - 3 animais de exemplo

### Fase 2: Autenticação (CONCLUÍDA)
- ✅ NextAuth.js configurado com Credentials provider
- ✅ Middleware de proteção de rotas criado
- ✅ Tipos TypeScript customizados para sessão
- ✅ Helper functions para autenticação (`getCurrentUser`, `requireAuth`, `requireRole`)
- ✅ API route de registro (`/api/auth/register`)
- ✅ Página de login (`/login`)
- ✅ Página de registro (`/register`)

### Fase 3: UI Base (CONCLUÍDA)
- ✅ Componentes shadcn/ui importados:
  - Button
  - Input
  - Label
  - Card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- ✅ Dashboard básico (`/dashboard`)
- ✅ Landing page atualizada com navegação

### Build
- ✅ Projeto compilando sem erros
- ⚠️ Apenas warnings sobre variáveis `bcrypt` e `password` não utilizadas (esperado)

---

## 📋 Próximos Passos Necessários

### 1. Configurar Banco de Dados PostgreSQL

Você precisa ter um banco PostgreSQL rodando. Opções:

#### Opção A: PostgreSQL Local
```bash
# Instalar PostgreSQL (Windows)
# Baixe em: https://www.postgresql.org/download/windows/

# Criar banco de dados
createdb kaniu

# Ou via psql:
psql -U postgres
CREATE DATABASE kaniu;
```

#### Opção B: Supabase (Recomendado - Grátis)
1. Criar conta em https://supabase.com
2. Criar novo projeto
3. Copiar a `Database URL` (Connection String)
4. Atualizar `.env`:
```env
DATABASE_URL="postgresql://[YOUR_SUPABASE_URL]"
```

#### Opção C: Neon (Alternativa Grátis)
1. Criar conta em https://neon.tech
2. Criar novo projeto
3. Copiar a connection string
4. Atualizar `.env`

### 2. Executar Migrations e Seed

```bash
# Push do schema para o banco
npm run db:push

# Executar seed para popular dados iniciais
npm run db:seed
```

### 3. Adicionar Campo Password ao Schema

**IMPORTANTE**: Atualmente, o sistema de autenticação está configurado mas o campo `password` não existe na tabela `users`. Você precisa:

1. Adicionar ao `prisma/schema.prisma`:
```prisma
model User {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String   @db.VarChar
  email      String   @unique @db.VarChar
  password   String   @db.VarChar  // ← ADICIONAR ESTA LINHA
  phone      String?  @db.VarChar
  // ... resto dos campos
}
```

2. Descomentar o código de hash de senha em:
   - `src/lib/auth/auth.ts` (linhas 28-32)
   - `src/app/api/auth/register/route.ts` (linha 47)

3. Aplicar mudanças:
```bash
npm run db:push
npm run db:seed
```

### 4. Testar o Sistema

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Acessar: http://localhost:3000
```

#### Usuários de Teste (após executar seed)
- **Admin**: admin@kaniu.com
- **Gerente de Abrigo**: joao@abrigo.com
- **Adotante**: maria@email.com

⚠️ **Nota**: Por enquanto, o login vai funcionar apenas verificando se o email existe no banco (sem verificar senha real).

---

## 🔄 Próximas Funcionalidades a Implementar

Seguindo o plano MVP do `plano.md`, as próximas etapas são:

### Fase 3: CRUD de Abrigos (2-3 dias)
- [ ] API routes para abrigos (GET, POST, PUT, DELETE)
- [ ] Página de listagem de abrigos
- [ ] Formulário de cadastro/edição de abrigo
- [ ] Validação com Zod

### Fase 4: CRUD de Animais (1-2 semanas)
- [ ] API routes para animais
- [ ] Sistema de upload de fotos (configurar Cloudinary ou similar)
- [ ] Formulário completo de cadastro de animal
- [ ] Listagem pública com filtros (espécie, raça, gênero, tamanho)
- [ ] Página de detalhes do animal
- [ ] Galeria de fotos

### Fase 5: Sistema de Adoção (1 semana)
- [ ] API routes para adoções
- [ ] Formulário de interesse em adoção
- [ ] Dashboard de aprovação (para shelter managers)
- [ ] Fluxo completo: inquiry → approved → finalized

### Fase 6: Dashboards Avançados
- [ ] Dashboard admin com estatísticas
- [ ] Dashboard do abrigo com métricas
- [ ] Dashboard do adotante com suas adoções

---

## 📁 Estrutura do Projeto

```
kaniu-webapp/
├── prisma/
│   ├── schema.prisma          # Schema do Prisma (completo)
│   └── seed.ts                # Seed de dados iniciais (criado)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │       └── register/route.ts        # API de registro
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Dashboard principal
│   │   ├── login/
│   │   │   └── page.tsx       # Página de login
│   │   ├── register/
│   │   │   └── page.tsx       # Página de registro
│   │   ├── layout.tsx         # Layout raiz com SessionProvider
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── providers/
│   │   │   └── session-provider.tsx  # Provider do NextAuth
│   │   └── ui/                # Componentes shadcn/ui
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── auth.ts        # Configuração NextAuth
│   │   │   └── session.ts     # Helper functions
│   │   ├── db/
│   │   │   └── prisma.ts      # Prisma client
│   │   └── utils.ts           # Utilities (cn)
│   ├── types/
│   │   └── next-auth.d.ts     # Tipos do NextAuth
│   └── middleware.ts          # Proteção de rotas
├── .env                       # Variáveis de ambiente (criado)
├── .env.example               # Exemplo de .env
├── components.json            # Config do shadcn/ui
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Iniciar servidor dev
npm run build                  # Build para produção
npm run start                  # Iniciar produção
npm run lint                   # Rodar ESLint

# Prisma
npm run db:push                # Push schema para o banco
npm run db:seed                # Popular banco com dados
npm run db:studio              # Abrir Prisma Studio (UI visual)
npx prisma generate            # Gerar Prisma Client
npx prisma migrate dev         # Criar migration

# TypeScript
npx tsc --noEmit               # Verificar erros TypeScript
```

---

## 🔐 Segurança

### Variáveis de Ambiente Sensíveis

Certifique-se de que `.env` está no `.gitignore` (já está) e nunca commite:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- API keys de serviços externos

### NextAuth Secret

Para produção, gere um secret seguro:
```bash
openssl rand -base64 32
```

Substitua no `.env`:
```env
NEXTAUTH_SECRET="seu-secret-super-seguro-aqui"
```

---

## 📚 Recursos e Documentação

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth.js**: https://next-auth.js.org/
- **shadcn/ui**: https://ui.shadcn.com/
- **TailwindCSS**: https://tailwindcss.com/docs
- **Plano Completo**: Ver `plano.md` para roadmap detalhado

---

## ❓ Troubleshooting

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Confirme que a `DATABASE_URL` no `.env` está correta
- Teste a conexão: `npx prisma db push`

### Erro: "Module not found"
- Execute: `npm install`
- Execute: `npx prisma generate`

### Erro de autenticação
- Verifique se o banco está populado: `npm run db:seed`
- Confirme que `NEXTAUTH_SECRET` está definido no `.env`

### Build falhando
- Limpe cache: `rm -rf .next` (ou `del .next` no Windows)
- Reinstale dependências: `npm install`

---

## 📝 Notas Importantes

1. **Campo Password**: Atualmente não implementado na tabela. Veja seção "Adicionar Campo Password" acima.

2. **Upload de Arquivos**: Para funcionalidade de upload de fotos, você precisará configurar:
   - Cloudinary (mais simples)
   - AWS S3
   - Supabase Storage

   Atualize as variáveis no `.env` quando escolher o serviço.

3. **Email**: Para notificações por email, configure Resend ou SendGrid no `.env`.

---

## ✅ Checklist de Setup

- [ ] PostgreSQL instalado e rodando (ou Supabase configurado)
- [ ] `.env` configurado com `DATABASE_URL` correto
- [ ] `npm install` executado
- [ ] `npm run db:push` executado com sucesso
- [ ] `npm run db:seed` executado com sucesso
- [ ] Campo `password` adicionado ao schema (opcional mas recomendado)
- [ ] `npm run dev` iniciando sem erros
- [ ] Consegue acessar http://localhost:3000
- [ ] Consegue fazer login com um dos usuários de teste

---

**Pronto para começar! 🎉**

Após completar o setup, você terá um sistema funcional com autenticação, dashboard e a base para implementar os módulos de Abrigos, Animais e Adoções.
