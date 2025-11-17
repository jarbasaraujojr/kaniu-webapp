# Scripts Úteis - Kaniu WebApp

Este documento descreve os scripts disponíveis para gerenciar os serviços do webapp.

## 🛑 Finalizar Todos os Serviços

### Opção 1: Comando NPM (Mais Fácil) ⭐

Funciona em Windows, Linux e Mac:

```bash
npm run stop
```

### Opção 2: Script Simples

#### Windows
```bash
stop.bat
```

#### Linux/Mac
```bash
./stop.sh
```

### Opção 3: Script Completo com Detalhes

#### Windows
```bash
kill-all-services.bat
```

#### Linux/Mac
```bash
./kill-all-services.sh
```

## 📋 O que o script faz

O script `kill-all-services` executa as seguintes ações:

1. **Finaliza processos Next.js** - Encerra todos os processos do servidor de desenvolvimento Next.js
2. **Finaliza processos Node.js** - Encerra todos os processos Node.js em execução
3. **Libera portas** - Força a liberação das portas:
   - `3000` (Next.js dev server)
   - `5432` (PostgreSQL)
4. **Limpa cache** - Remove a pasta `.next` (cache de build do Next.js)

## 🎯 Quando usar

Use este script quando:

- ✅ O servidor de desenvolvimento não está respondendo
- ✅ Você recebe erro "Port 3000 is already in use"
- ✅ Precisa garantir que todos os processos foram encerrados antes de reiniciar
- ✅ Quer limpar o cache do Next.js
- ✅ Está tendo problemas de hot reload ou cache

## ⚠️ Avisos

- O script finaliza **TODOS** os processos Node.js em execução
- Se você tiver outros projetos Node.js rodando, eles também serão finalizados
- O cache `.next` será removido, o próximo build pode demorar mais

## 🔄 Reiniciar após usar o script

Após executar o script, você pode reiniciar o servidor normalmente:

```bash
npm run dev
```

## 📝 Solução de Problemas

### Windows: "Acesso negado"
Execute o Prompt de Comando ou PowerShell como **Administrador**

### Linux/Mac: "Permission denied"
```bash
chmod +x kill-all-services.sh
./kill-all-services.sh
```

### Porta ainda em uso
Tente executar o script novamente ou reinicie o computador.

## 🚀 Scripts de Desenvolvimento

### Servidor
```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção
npm run stop         # Finaliza todos os serviços
npm run clean        # Limpa cache do Next.js (.next)
```

### Banco de Dados
```bash
npm run db:generate  # Gera Prisma Client
npm run db:push      # Sincroniza schema com banco
npm run db:studio    # Abre interface visual do banco
npm run db:seed      # Popula banco com dados iniciais
```

### Prisma (comandos avançados)
```bash
npx prisma migrate dev      # Cria e executa nova migração
npx prisma migrate reset    # Reseta banco e aplica todas migrações
npx prisma migrate deploy   # Aplica migrações em produção
npx prisma db pull          # Gera schema a partir do banco
```

## 💡 Dicas

- Use o script sempre que quiser garantir um "estado limpo"
- Adicione ao `.gitignore` se quiser versões personalizadas
- Pode ser executado com duplo clique (Windows) ou via terminal
