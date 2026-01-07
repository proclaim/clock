#!/bin/bash

# Deployment script for Clock system
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Error: Invalid environment. Use 'staging' or 'production'"
    echo "Usage: ./scripts/deploy.sh [staging|production]"
    exit 1
fi

echo "=========================================="
echo "Deploying Clock System - $ENVIRONMENT"
echo "=========================================="

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

# Set the appropriate docker-compose file
if [ "$ENVIRONMENT" = "staging" ]; then
    COMPOSE_FILE="docker-compose.staging.yml"
    PORT=8002
else
    COMPOSE_FILE="docker-compose.production.yml"
    PORT=8001
fi

echo "Using compose file: $COMPOSE_FILE"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Error: $COMPOSE_FILE not found"
    exit 1
fi

# Pull latest code (if in a git repository)
if [ -d .git ]; then
    echo "Pulling latest code from git..."
    git pull origin main || {
        echo "Warning: Git pull failed or not on main branch"
    }
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Remove old images (optional, comment out to keep old images)
# echo "Removing old images..."
# docker-compose -f "$COMPOSE_FILE" down --rmi local

# Build and start new containers
echo "Building and starting containers..."
docker-compose -f "$COMPOSE_FILE" up -d --build

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 10

# Check service status
echo "Checking service status..."
docker-compose -f "$COMPOSE_FILE" ps

# Run health check
echo "Running health check..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "Health check passed!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Error: Health check failed after $MAX_RETRIES attempts"
    echo "Showing logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
    exit 1
fi

# Show logs
echo "Showing recent logs..."
docker-compose -f "$COMPOSE_FILE" logs --tail=20

echo "=========================================="
echo "Deployment completed successfully!"
echo "Environment: $ENVIRONMENT"
echo "URL: http://localhost:$PORT"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop:         docker-compose -f $COMPOSE_FILE down"
echo "  Restart:      docker-compose -f $COMPOSE_FILE restart"
echo "  Shell access: docker-compose -f $COMPOSE_FILE exec backend sh"
echo "=========================================="
