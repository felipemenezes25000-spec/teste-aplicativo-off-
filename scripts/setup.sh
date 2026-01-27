#!/bin/bash

echo "🏥 RenoveJá - Setup Script"
echo "=========================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker encontrado${NC}"
    
    read -p "Deseja rodar com Docker? (y/n): " use_docker
    
    if [ "$use_docker" = "y" ]; then
        echo "🐳 Iniciando com Docker..."
        docker-compose up -d
        echo ""
        echo -e "${GREEN}✓ Projeto iniciado!${NC}"
        echo "Frontend: http://localhost:3000"
        echo "Backend: http://localhost:8001"
        exit 0
    fi
fi

echo ""
echo "📦 Configurando manualmente..."
echo ""

# Backend Setup
echo -e "${YELLOW}[1/4] Configurando Backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

echo "Ativando ambiente virtual..."
source venv/bin/activate

echo "Instalando dependências..."
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    echo "Criando .env a partir do exemplo..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Edite backend/.env com suas credenciais${NC}"
fi

cd ..

# Frontend Setup
echo ""
echo -e "${YELLOW}[2/4] Configurando Frontend...${NC}"
cd frontend

echo "Instalando dependências..."
yarn install --silent

if [ ! -f ".env" ]; then
    echo "Criando .env a partir do exemplo..."
    cp .env.example .env
fi

cd ..

# MongoDB Check
echo ""
echo -e "${YELLOW}[3/4] Verificando MongoDB...${NC}"

if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB encontrado${NC}"
else
    echo -e "${RED}✗ MongoDB não encontrado${NC}"
    echo "Instale MongoDB ou use Docker:"
    echo "  docker run -d -p 27017:27017 --name mongodb mongo:latest"
fi

# Done
echo ""
echo -e "${YELLOW}[4/4] Setup completo!${NC}"
echo ""
echo "Para rodar o projeto:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn server:app --reload --port 8001"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  yarn start"
echo ""
echo -e "${GREEN}Boa sorte! 🚀${NC}"
