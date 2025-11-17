# 🚀 Quick Start - Kaniu WebApp

Guia rápido para começar a desenvolver.

## ⚡ Comandos Essenciais

### Iniciar servidor de desenvolvimento
```bash
npm run dev
```
Servidor estará em: http://localhost:3000

### Parar todos os serviços
```bash
npm run stop
```
**USE ESTE COMANDO** quando:
- Receber erro de "porta em uso"
- O servidor travar ou não responder
- Quiser ter certeza que tudo está parado

### Limpar cache
```bash
npm run clean
```

### Ver banco de dados visualmente
```bash
npm run db:studio
```
Interface estará em: http://localhost:5555

## 📂 Estrutura de Pastas

```
src/
├── app/
│   ├── api/              # API Routes (backend)
│   ├── dashboard/        # Páginas protegidas
│   │   ├── abrigos/      # ✅ CRUD de abrigos
│   │   ├── animais/      # Listagem de animais
│   │   └── painel/       # Dashboard principal
│   └── (auth)/           # Login/Register
├── components/
│   ├── layout/           # Header, Sidebar, etc
│   └── ui/               # Componentes base
└── lib/
    ├── auth/             # NextAuth config
    └── db/               # Prisma client

prisma/
├── schema.prisma         # Definição do banco
├── seed.ts              # Dados iniciais
└── migrations/          # Histórico de mudanças
```

## 🎯 Fluxo de Desenvolvimento

1. **Fazer alterações no código**
2. **Servidor atualiza automaticamente** (hot reload)
3. Se algo der errado: `npm run stop`
4. Reiniciar: `npm run dev`

## 🗄️ Banco de Dados

### Sincronizar schema
```bash
npm run db:push
```

### Criar nova migração
```bash
npx prisma migrate dev --name nome_da_migracao
```

### Popular com dados
```bash
npm run db:seed
```

## 🔑 Usuários Padrão (após seed)

**Admin:**
- Email: `admin@kaniu.com`
- Senha: `admin123`

**Gerente:**
- Email: `manager@shelter1.com`
- Senha: `manager123`

## 📚 Documentação Completa

- [SCRIPTS.md](SCRIPTS.md) - Todos os scripts disponíveis
- [TODO.md](TODO.md) - Roadmap de funcionalidades
- [README.md](README.md) - Documentação principal

## ❓ Problemas Comuns

### "Port 3000 already in use"
```bash
npm run stop
npm run dev
```

### "Prisma Client not found"
```bash
npm run db:generate
```

### Servidor não atualiza
```bash
npm run stop
npm run clean
npm run dev
```

### Erro de banco de dados
```bash
npm run db:push
npm run db:seed
```

## 🆘 Ajuda

Se nada funcionar:
1. `npm run stop`
2. `npm run clean`
3. `npm install`
4. `npm run db:generate`
5. `npm run dev`

---

**Pronto para começar!** Execute `npm run dev` e acesse http://localhost:3000
