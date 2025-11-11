#!/bin/bash

# Script de Deploy Automático - OnClickWise Frontend
# Execute: bash deploy.sh

# Não usar set -e para melhor controle de erros
# set -e

echo "🚀 OnClickWise Frontend - Deploy Automático"
echo "============================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado. Execute o deploy do backend primeiro ou instale Node.js."
    echo ""
    echo "Para instalar Node.js manualmente:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js encontrado: $NODE_VERSION"

# Verificar versão do Node.js
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$MAJOR_VERSION" -lt 18 ]; then
    print_error "Node.js versão $NODE_VERSION é muito antiga. Requer Node.js 18+"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm não encontrado. Instalando..."
    if ! timeout 120 sudo apt install -y npm 2>&1; then
        print_error "Falha ao instalar npm"
        exit 1
    fi
fi

# 2. Instalar PM2 se não existir
if ! command -v pm2 &> /dev/null; then
    print_success "Instalando PM2..."
    if ! timeout 120 sudo npm install -g pm2 2>&1; then
        print_error "Falha ao instalar PM2"
        exit 1
    fi
else
    print_success "PM2 já instalado"
fi

# 3. Instalar dependências
print_success "Instalando dependências do projeto..."
print_info "Isso pode demorar alguns minutos..."
if ! timeout 600 npm install 2>&1; then
    print_error "Falha ao instalar dependências"
    exit 1
fi

# 4. Configurar .env
if [ ! -f .env ]; then
    print_success "Criando arquivo .env..."
    if [ ! -f env.example ]; then
        print_error "Arquivo env.example não encontrado!"
        exit 1
    fi
    
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
            if grep -q "NEXT_PUBLIC_API_URL" .env; then
                sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" .env
            else
                echo "NEXT_PUBLIC_API_URL=$API_URL" >> .env
            fi
        fi
    fi
fi

# 5. Build do projeto
print_success "Fazendo build do projeto (isso pode demorar vários minutos)..."
print_info "Aguarde, isso é normal..."
if ! timeout 1800 npm run build 2>&1; then
    print_error "Falha ao fazer build do projeto"
    print_info "Verifique os erros acima e tente novamente"
    exit 1
fi

# 6. Criar diretórios necessários
mkdir -p logs
print_success "Diretórios criados"

# 7. Instalar Nginx se não existir
if ! command -v nginx &> /dev/null; then
    print_success "Instalando Nginx..."
    if ! timeout 60 sudo apt update -qq 2>&1; then
        print_warning "Falha ao atualizar lista de pacotes (continuando...)"
    fi
    if ! timeout 180 sudo apt install -y nginx 2>&1; then
        print_error "Falha ao instalar Nginx"
        exit 1
    fi
else
    print_success "Nginx já instalado"
fi

# 8. Configurar Nginx (opcional)
read -p "Configurar Nginx? (s/n) [n]: " CONFIGURE_NGINX
CONFIGURE_NGINX=${CONFIGURE_NGINX:-n}

DOMAIN=""
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
        
        if sudo nginx -t 2>&1; then
            sudo systemctl restart nginx 2>&1
            sudo systemctl enable nginx > /dev/null 2>&1
            print_success "Nginx configurado!"
        else
            print_error "Erro na configuração do Nginx"
            exit 1
        fi
    fi
fi

# 9. Configurar firewall
if command -v ufw &> /dev/null; then
    print_info "Configurando firewall..."
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
    print_success "ecosystem.config.js criado"
fi

# 12. Iniciar aplicação
print_success "Iniciando aplicação com PM2..."
if pm2 start ecosystem.config.js 2>&1; then
    pm2 save 2>&1 || true
else
    print_error "Falha ao iniciar aplicação com PM2"
    print_info "Verifique os logs: pm2 logs onclickwise-frontend"
    exit 1
fi

# 13. Configurar PM2 para iniciar no boot
print_info "Configurando PM2 para iniciar no boot..."
STARTUP_CMD=$(pm2 startup 2>&1 | grep -o 'sudo.*' || echo "")
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD > /dev/null 2>&1 || print_warning "Falha ao configurar PM2 no boot (não crítico)"
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
