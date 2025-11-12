#!/bin/bash
# =====================================================
# Script de Execução da Migração - Linux/Mac
# =====================================================
# Execute este script para rodar toda a migração
# chmod +x run_migration.sh && ./run_migration.sh
# =====================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "===================================================="
echo "MIGRAÇÃO DE BASE DE DADOS - KANIU"
echo "===================================================="
echo ""

# ==================
# CONFIGURAÇÕES
# ==================
echo "Por favor, configure as variáveis de conexão:"
echo ""

read -p "Host da base de dados (localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Porta (5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Usuário PostgreSQL: " DB_USER
if [ -z "$DB_USER" ]; then
    echo -e "${RED}ERRO: Usuário é obrigatório${NC}"
    exit 1
fi

read -sp "Senha (opcional, será solicitada se necessário): " DB_PASS
echo ""

read -p "Nome da base ANTIGA: " DB_OLD
if [ -z "$DB_OLD" ]; then
    echo -e "${RED}ERRO: Nome da base antiga é obrigatório${NC}"
    exit 1
fi

read -p "Nome da base NOVA: " DB_NEW
if [ -z "$DB_NEW" ]; then
    echo -e "${RED}ERRO: Nome da base nova é obrigatório${NC}"
    exit 1
fi

echo ""
echo "===================================================="
echo "CONFIGURAÇÃO"
echo "===================================================="
echo "Host: $DB_HOST:$DB_PORT"
echo "Usuário: $DB_USER"
echo "Base Antiga: $DB_OLD"
echo "Base Nova: $DB_NEW"
echo "===================================================="
echo ""

read -p "Confirmar configuração? (s/N): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "Migração cancelada pelo usuário."
    exit 0
fi

# ==================
# CONFIGURAR VARIÁVEIS DE AMBIENTE
# ==================
export PGHOST=$DB_HOST
export PGPORT=$DB_PORT
export PGUSER=$DB_USER
if [ -n "$DB_PASS" ]; then
    export PGPASSWORD=$DB_PASS
fi

# ==================
# TESTAR CONEXÕES
# ==================
echo ""
echo "Testando conexões..."

if ! psql -d $DB_OLD -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}ERRO: Não foi possível conectar à base antiga${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Conexão com base antiga${NC}"

if ! psql -d $DB_NEW -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}ERRO: Não foi possível conectar à base nova${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Conexão com base nova${NC}"

# ==================
# CRIAR DIRETÓRIO DE LOGS
# ==================
LOG_DIR="logs/migration_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"

echo ""
echo "Logs serão salvos em: $LOG_DIR"
echo ""

# ==================
# AVISOS
# ==================
echo "===================================================="
echo "AVISOS IMPORTANTES"
echo "===================================================="
echo ""
echo "- A migração pode demorar 7-12 horas"
echo "- Recomenda-se executar em horário de baixo uso"
echo "- Um backup será criado antes da migração"
echo "- Todos os usuários precisarão resetar senhas"
echo ""
echo "===================================================="
echo ""

read -p "Deseja continuar? (s/N): " CONTINUE
if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
    echo "Migração cancelada pelo usuário."
    exit 0
fi

# ==================
# INÍCIO DA MIGRAÇÃO
# ==================
echo ""
echo "===================================================="
echo "INICIANDO MIGRAÇÃO"
echo "===================================================="
echo "Horário de início: $(date)"
echo "===================================================="
echo ""

# Array de scripts
SCRIPTS=(
    "01_backup.sql"
    "02_create_mapping_tables.sql"
    "03_data_quality_check.sql"
    "04_migrate_roles.sql"
    "05_migrate_catalogs.sql"
    "06_migrate_users.sql"
    "07_migrate_shelters.sql"
    "08_migrate_animals.sql"
    "09_migrate_animal_photos.sql"
    "10_migrate_animal_weights.sql"
    "11_migrate_documents.sql"
    "12_migrate_medical_records.sql"
    "13_migrate_adoption_events.sql"
    "14_migrate_animal_events.sql"
    "15_migrate_favorites.sql"
    "16_validate_migration.sql"
    "17_cleanup.sql"
)

# Contador
TOTAL=${#SCRIPTS[@]}
CURRENT=0

# Executar cada script
for SCRIPT in "${SCRIPTS[@]}"; do
    CURRENT=$((CURRENT + 1))
    SCRIPT_PATH="scripts/$SCRIPT"
    LOG_FILE="$LOG_DIR/${SCRIPT%.sql}.log"

    echo ""
    echo -e "${BLUE}[$CURRENT/$TOTAL] Executando $SCRIPT...${NC}"
    echo "----------------------------------------------------"

    # Scripts 01 e 03 executam na base antiga
    if [ "$SCRIPT" == "01_backup.sql" ] || [ "$SCRIPT" == "03_data_quality_check.sql" ]; then
        TARGET_DB=$DB_OLD
    else
        TARGET_DB=$DB_NEW
    fi

    # Executar script
    if psql -d $TARGET_DB -f "$SCRIPT_PATH" > "$LOG_FILE" 2>&1; then
        echo -e "${GREEN}[OK] $SCRIPT concluído${NC}"
    else
        echo -e "${RED}[ERRO] Falha ao executar $SCRIPT${NC}"
        echo "Verifique o log: $LOG_FILE"
        echo ""
        echo "===================================================="
        echo "MIGRAÇÃO FALHOU"
        echo "===================================================="
        echo "Script com erro: $SCRIPT"
        echo "Log: $LOG_FILE"
        echo ""
        read -p "Deseja executar rollback? (s/N): " ROLLBACK
        if [ "$ROLLBACK" == "s" ] || [ "$ROLLBACK" == "S" ]; then
            echo "Executando rollback..."
            psql -d $DB_NEW -f scripts/rollback/rollback_all.sql
        fi
        exit 1
    fi

    # Pausas estratégicas para revisão
    if [ "$SCRIPT" == "03_data_quality_check.sql" ]; then
        echo ""
        echo "===================================================="
        echo "PONTO DE VERIFICAÇÃO: Análise de Qualidade"
        echo "===================================================="
        echo "Revise o arquivo: $LOG_FILE"
        echo "Verifique se há problemas críticos antes de continuar."
        echo ""
        read -p "Continuar? (s/N): " CONTINUE_AFTER_QC
        if [ "$CONTINUE_AFTER_QC" != "s" ] && [ "$CONTINUE_AFTER_QC" != "S" ]; then
            echo "Migração interrompida pelo usuário."
            exit 0
        fi
    fi

    if [ "$SCRIPT" == "16_validate_migration.sql" ]; then
        echo ""
        echo "===================================================="
        echo "PONTO DE VERIFICAÇÃO: Validação"
        echo "===================================================="
        echo "Revise o arquivo: $LOG_FILE"
        echo "Verifique se há erros na validação."
        echo ""
        read -p "Continuar? (s/N): " CONTINUE_AFTER_VAL
        if [ "$CONTINUE_AFTER_VAL" != "s" ] && [ "$CONTINUE_AFTER_VAL" != "S" ]; then
            echo "Migração interrompida pelo usuário."
            exit 0
        fi
    fi
done

# ==================
# FINALIZAÇÃO
# ==================
echo ""
echo "===================================================="
echo -e "${GREEN}MIGRAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo "===================================================="
echo "Horário de término: $(date)"
echo ""
echo "Logs salvos em: $LOG_DIR"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Revise os logs de validação"
echo "2. Execute testes da aplicação"
echo "3. Configure sistema de reset de senha"
echo "4. Notifique usuários sobre a migração"
echo "5. Mantenha base antiga em modo read-only por 90 dias"
echo ""
echo "===================================================="

# Perguntar se quer abrir os logs
read -p "Deseja abrir o diretório de logs? (s/N): " OPEN_LOGS
if [ "$OPEN_LOGS" == "s" ] || [ "$OPEN_LOGS" == "S" ]; then
    if command -v xdg-open > /dev/null; then
        xdg-open "$LOG_DIR"
    elif command -v open > /dev/null; then
        open "$LOG_DIR"
    else
        echo "Abra manualmente: $LOG_DIR"
    fi
fi

exit 0
