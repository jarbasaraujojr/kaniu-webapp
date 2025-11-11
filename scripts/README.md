# Scripts de Deploy e Manutenção

Este diretório contém scripts úteis para deploy e manutenção do Kaniu WebApp.

## Scripts Disponíveis

### 1. setup-vps.sh
Configura um VPS novo do zero com todas as dependências necessárias.

**Uso (no VPS):**
```bash
# Opção 1: Download e execução direta
curl -fsSL https://raw.githubusercontent.com/seu-usuario/kaniu-webapp/main/scripts/setup-vps.sh | sudo bash

# Opção 2: Download e execução manual
wget https://raw.githubusercontent.com/seu-usuario/kaniu-webapp/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

**O que faz:**
- Atualiza o sistema operacional
- Instala Docker e Docker Compose
- Configura firewall (UFW)
- Instala Fail2ban (proteção contra ataques)
- Configura timezone
- Aplica otimizações de sistema

### 2. deploy.sh
Faz o deploy ou atualização da aplicação.

**Uso:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**O que faz:**
- Verifica dependências
- Faz pull das últimas mudanças (se for atualização)
- Para containers existentes
- Faz build das imagens Docker
- Inicia os containers
- Verifica status e logs

### 3. backup.sh
Cria backup do banco de dados e configurações.

**Uso:**
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

**Configuração via variáveis de ambiente:**
```bash
# Diretório de backup (padrão: ~/backups/kaniu)
BACKUP_DIR=/caminho/para/backups ./scripts/backup.sh

# Dias de retenção (padrão: 7)
RETENTION_DAYS=30 ./scripts/backup.sh

# Fazer backup dos volumes do Docker
BACKUP_VOLUMES=true ./scripts/backup.sh
```

**O que faz:**
- Backup do banco de dados PostgreSQL
- Backup dos arquivos de configuração
- Backup dos volumes do Docker (opcional)
- Remove backups antigos automaticamente
- Comprime os arquivos

**Agendar backup automático (cron):**
```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2h da manhã
0 2 * * * /caminho/para/kaniu-webapp/scripts/backup.sh
```

## Fluxo de Deploy Completo

### Deploy Inicial

1. **No VPS, executar setup:**
```bash
sudo bash scripts/setup-vps.sh
```

2. **Clonar repositório:**
```bash
cd /opt/apps
git clone https://github.com/seu-usuario/kaniu-webapp.git
cd kaniu-webapp
```

3. **Configurar ambiente:**
```bash
cp .env.production.example .env
nano .env
# Configurar todas as variáveis necessárias
```

4. **Fazer deploy:**
```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

### Atualização

```bash
cd /opt/apps/kaniu-webapp
./scripts/deploy.sh
```

### Backup Manual

```bash
./scripts/backup.sh
```

## Permissões

Todos os scripts precisam de permissão de execução:

```bash
chmod +x scripts/*.sh
```

## Troubleshooting

### Script não executa
```bash
# Verificar permissões
ls -la scripts/

# Dar permissão de execução
chmod +x scripts/nome-do-script.sh

# Verificar se tem caracteres Windows (^M)
dos2unix scripts/nome-do-script.sh
```

### Erro de permissão no Docker
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente
```

## Notas

- `setup-vps.sh` deve ser executado com `sudo`
- `deploy.sh` e `backup.sh` devem ser executados como usuário normal (com permissão Docker)
- Sempre teste os scripts em ambiente de desenvolvimento primeiro
- Mantenha backups antes de fazer atualizações importantes
