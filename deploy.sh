#!/bin/bash

# Script de Deploy Automático - OnClickWise Frontend
# Execute: bash deploy.sh

set -e

echo "🚀 OnClickWise Frontend - Deploy Automático"
echo "============================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado. Execute o deploy do backend primeiro ou instale Node.js."
    exit 1
fi
print_success "Node.js encontrado: $(node --version)"

# 2. Instalar PM2 se não existir
if ! command -v pm2 &> /dev/null; then
    print_success "Instalando PM2..."
    sudo npm install -g pm2 > /dev/null 2>&1
else
    print_success "PM2 já instalado"
fi

# 3. Instalar dependências
print_success "Instalando dependências..."
npm install --silent

# 4. Configurar .env
if [ ! -f .env ]; then
    print_success "Criando arquivo .env..."
    cp env.example .env
    
    # Perguntar URL da API
    read -p "Digite a URL da API (ex: http://api.seudominio.com ou http://localhost:3000): " API_URL
    API_URL=${API_URL:-http://localhost:3000}
    
    sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:3000|NEXT_PUBLIC_API_URL=$API_URL|" .env
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" .env
    
    print_success "Arquivo .env criado com sucesso!"
else
    print_warning ".env já existe, pulando criação..."
    # Verificar se API_URL está configurado
    if ! grep -q "NEXT_PUBLIC_API_URL" .env || grep -q "NEXT_PUBLIC_API_URL=http://localhost:3000" .env; then
        read -p "Digite a URL da API (ex: http://api.seudominio.com): " API_URL
        if [ ! -z "$API_URL" ]; then
            sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" .env
        fi
    fi
fi

# 5. Build do projeto
print_success "Fazendo build do projeto (isso pode demorar alguns minutos)..."
npm run build

# 6. Criar diretórios necessários
mkdir -p logs
print_success "Diretórios criados"

# 7. Instalar Nginx se não existir
if ! command -v nginx &> /dev/null; then
    print_success "Instalando Nginx..."
    sudo apt update -qq
    sudo apt install -y nginx > /dev/null 2>&1
else
    print_success "Nginx já instalado"
fi

# 8. Configurar Nginx (opcional)
read -p "Configurar Nginx? (s/n) [n]: " CONFIGURE_NGINX
CONFIGURE_NGINX=${CONFIGURE_NGINX:-n}

if [ "$CONFIGURE_NGINX" = "s" ] || [ "$CONFIGURE_NGINX" = "S" ]; then
    read -p "Digite o domínio do frontend (ex: seudominio.com): " DOMAIN
    
    if [ ! -z "$DOMAIN" ]; then
        print_success "Configurando Nginx para $DOMAIN..."
        
        sudo tee /etc/nginx/sites-available/onclickwise-frontend > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
EOF
        
        sudo ln -sf /etc/nginx/sites-available/onclickwise-frontend /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t > /dev/null 2>&1
        sudo systemctl restart nginx
        sudo systemctl enable nginx > /dev/null 2>&1
        
        print_success "Nginx configurado!"
    fi
fi

# 9. Configurar firewall
if command -v ufw &> /dev/null; then
    sudo ufw allow OpenSSH > /dev/null 2>&1 || true
    sudo ufw allow 'Nginx Full' > /dev/null 2>&1 || true
    echo "y" | sudo ufw enable > /dev/null 2>&1 || true
fi

# 10. Parar instância anterior se existir
pm2 stop onclickwise-frontend > /dev/null 2>&1 || true
pm2 delete onclickwise-frontend > /dev/null 2>&1 || true

# 11. Criar ecosystem.config.js se não existir
if [ ! -f ecosystem.config.js ]; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'onclickwise-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF
fi

# 12. Iniciar aplicação
print_success "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js
pm2 save

# 13. Configurar PM2 para iniciar no boot
STARTUP_CMD=$(pm2 startup 2>&1 | grep -o 'sudo.*' || echo "")
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD > /dev/null 2>&1 || true
fi

# 14. Verificar status
sleep 3
if pm2 list | grep -q "onclickwise-frontend.*online"; then
    print_success "✅ Frontend iniciado com sucesso!"
    echo ""
    echo "📋 Informações:"
    echo "   - Status: pm2 status"
    echo "   - Logs: pm2 logs onclickwise-frontend"
    echo "   - Reiniciar: pm2 restart onclickwise-frontend"
    echo "   - URL: http://localhost:3001"
    if [ ! -z "$DOMAIN" ]; then
        echo "   - Domínio: http://$DOMAIN"
    fi
    echo ""
else
    print_error "❌ Erro ao iniciar aplicação. Verifique os logs: pm2 logs onclickwise-frontend"
    exit 1
fi

