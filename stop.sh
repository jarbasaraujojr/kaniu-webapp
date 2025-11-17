#!/bin/bash

echo "Finalizando servicos do Kaniu WebApp..."
echo ""

# Finalizar Node.js
pkill -f "node" 2>/dev/null && echo "[OK] Processos Node.js finalizados" || echo "[--] Nenhum processo Node.js encontrado"

# Liberar porta 3000
PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_PID" ]; then
    kill -9 $PORT_PID 2>/dev/null
    echo "[OK] Porta 3000 liberada"
fi

# Limpar cache
if [ -d ".next" ]; then
    rm -rf .next 2>/dev/null
    echo "[OK] Cache .next removido"
fi

echo ""
echo "Todos os servicos foram finalizados!"
echo ""
