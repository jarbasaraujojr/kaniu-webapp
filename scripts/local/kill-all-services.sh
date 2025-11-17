#!/bin/bash

echo "============================================"
echo " Finalizando Servicos do Kaniu WebApp"
echo "============================================"
echo ""

echo "[1/4] Finalizando processos Next.js..."
pkill -f "next dev" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Next.js finalizado"
else
    echo "- Nenhum processo Next.js encontrado"
fi
echo ""

echo "[2/4] Finalizando todos os processos Node.js..."
pkill -f "node" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Node.js finalizado"
else
    echo "- Nenhum processo Node.js encontrado"
fi
echo ""

echo "[3/4] Liberando portas 3000, 5432 e outras comuns..."

# Porta 3000
PORT_3000_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000_PID" ]; then
    kill -9 $PORT_3000_PID 2>/dev/null
    echo "✓ Porta 3000 liberada (PID: $PORT_3000_PID)"
else
    echo "- Porta 3000 já está livre"
fi

# Porta 5432
PORT_5432_PID=$(lsof -ti:5432 2>/dev/null)
if [ ! -z "$PORT_5432_PID" ]; then
    kill -9 $PORT_5432_PID 2>/dev/null
    echo "✓ Porta 5432 liberada (PID: $PORT_5432_PID)"
else
    echo "- Porta 5432 já está livre"
fi
echo ""

echo "[4/4] Limpando cache do Next.js..."
if [ -d ".next" ]; then
    rm -rf .next 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ Cache .next removido"
    fi
else
    echo "- Sem cache .next para limpar"
fi
echo ""

echo "============================================"
echo " Todos os servicos foram finalizados!"
echo "============================================"
echo ""

echo "Processos Node.js restantes:"
ps aux | grep node | grep -v grep || echo "- Nenhum processo Node.js em execucao"
echo ""

echo "Portas em uso:"
lsof -i:3000 2>/dev/null || echo "- Porta 3000 livre"
lsof -i:5432 2>/dev/null || echo "- Porta 5432 livre"
echo ""
