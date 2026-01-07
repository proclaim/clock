#!/bin/bash

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/proclaim/clock.git"
DEPLOYMENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS_DIR="$DEPLOYMENT_DIR/repos"
CLOCK_REPO_DIR="$REPOS_DIR/clock"
ENVIRONMENT="${1:-prod}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Clock Deployment Script${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}========================================${NC}"

# Validate environment
if [[ "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}Error: Only 'prod' environment is supported${NC}"
    echo "Usage: ./build.sh prod"
    exit 1
fi

# Step 1: Clone/Update repository
echo -e "\n${YELLOW}[1/6]${NC} Updating repository..."
if [ ! -d "$CLOCK_REPO_DIR" ]; then
    echo "Cloning repository..."
    mkdir -p "$REPOS_DIR"
    git clone "$REPO_URL" "$CLOCK_REPO_DIR"
else
    echo "Repository exists, pulling latest changes..."
    cd "$CLOCK_REPO_DIR"
    git fetch origin
    git reset --hard origin/main
    cd "$DEPLOYMENT_DIR"
fi

# Step 2: Copy production configuration files
echo -e "\n${YELLOW}[2/6]${NC} Setting up configuration files..."
cp "$CLOCK_REPO_DIR/docker-compose.prod.yml" "$DEPLOYMENT_DIR/"
mkdir -p "$DEPLOYMENT_DIR/nginx/prod"
cp "$CLOCK_REPO_DIR/nginx/prod/nginx.prod.conf" "$DEPLOYMENT_DIR/nginx/prod/"

# Step 3: Load environment variables
echo -e "\n${YELLOW}[3/6]${NC} Loading environment variables..."
if [ ! -f "$DEPLOYMENT_DIR/.env.prod" ]; then
    echo -e "${RED}Error: .env.prod not found${NC}"
    echo "Please create .env.prod with required variables"
    echo "See DEPLOYMENT_PROD.md for template"
    exit 1
fi
export $(cat "$DEPLOYMENT_DIR/.env.prod" | grep -v '#' | xargs)

# Step 4: Build Docker images
echo -e "\n${YELLOW}[4/6]${NC} Building Docker images..."
cd "$CLOCK_REPO_DIR"

# Build backend image
echo "Building clock_backend_prod image..."
docker build \
    -f clock-backend/Dockerfile \
    -t clock_backend_prod \
    -t clock_backend_prod:latest \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown") \
    clock-backend/

# Build frontend image
echo "Building clock_frontend_prod image..."
docker build \
    -f clock-frontend/Dockerfile \
    -t clock_frontend_prod \
    -t clock_frontend_prod:latest \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown") \
    clock-frontend/

cd "$DEPLOYMENT_DIR"

# Step 5: Stop existing containers (if any)
echo -e "\n${YELLOW}[5/6]${NC} Stopping existing containers..."
if [ -f "$DEPLOYMENT_DIR/docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
fi

# Step 6: Start new containers
echo -e "\n${YELLOW}[6/6]${NC} Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Verify services
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Deployment Status${NC}"
echo -e "${YELLOW}========================================${NC}"

docker-compose -f docker-compose.prod.yml ps

# Check health
echo -e "\n${YELLOW}Health Checks:${NC}"
if curl -s http://localhost/health > /dev/null; then
    echo -e "${GREEN}✓ Nginx: OK${NC}"
else
    echo -e "${RED}✗ Nginx: FAILED${NC}"
fi

if curl -s http://localhost/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API: OK${NC}"
else
    echo -e "${RED}✗ Backend API: FAILED (may still be starting)${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}Application available at: http://time.tcode.tw${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Quick Commands:${NC}"
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "Stop services: docker-compose -f docker-compose.prod.yml down"
echo "Restart service: docker-compose -f docker-compose.prod.yml restart clock_backend_prod"

exit 0
