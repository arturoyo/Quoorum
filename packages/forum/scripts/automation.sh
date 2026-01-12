#!/bin/bash
# Forum Automation Scripts
# Quick bonus: Helpful automation scripts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# SETUP FUNCTIONS
# ============================================================================

setup_env() {
    log_info "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found, creating from example..."
        cp .env.example .env
        log_success "Created .env file"
        log_warning "Please edit .env with your credentials"
    else
        log_success ".env file exists"
    fi
}

setup_db() {
    log_info "Setting up database..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set in .env"
        exit 1
    fi
    
    cd packages/db
    pnpm drizzle-kit migrate
    cd ../..
    
    log_success "Database setup complete"
}

setup_deps() {
    log_info "Installing dependencies..."
    
    pnpm install
    
    log_success "Dependencies installed"
}

# ============================================================================
# BUILD FUNCTIONS
# ============================================================================

build_all() {
    log_info "Building all packages..."
    
    pnpm build
    
    log_success "Build complete"
}

build_forum() {
    log_info "Building forum package..."
    
    cd packages/forum
    pnpm build
    cd ../..
    
    log_success "Forum package built"
}

# ============================================================================
# TEST FUNCTIONS
# ============================================================================

test_all() {
    log_info "Running all tests..."
    
    pnpm test
    
    log_success "All tests passed"
}

test_forum() {
    log_info "Running forum tests..."
    
    cd packages/forum
    pnpm test
    cd ../..
    
    log_success "Forum tests passed"
}

typecheck_all() {
    log_info "Type checking..."
    
    pnpm typecheck
    
    log_success "Type check passed"
}

# ============================================================================
# DEPLOYMENT FUNCTIONS
# ============================================================================

deploy_staging() {
    log_info "Deploying to staging..."
    
    # Build
    build_all
    
    # Run tests
    test_all
    
    # Deploy (example with Vercel)
    log_info "Deploying frontend..."
    cd apps/web
    vercel --prod=false
    cd ../..
    
    log_success "Deployed to staging"
}

deploy_production() {
    log_warning "Deploying to PRODUCTION..."
    read -p "Are you sure? (yes/no) " -n 3 -r
    echo
    
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Build
    build_all
    
    # Run tests
    test_all
    
    # Type check
    typecheck_all
    
    # Deploy
    log_info "Deploying frontend..."
    cd apps/web
    vercel --prod
    cd ../..
    
    log_success "Deployed to production"
}

# ============================================================================
# MAINTENANCE FUNCTIONS
# ============================================================================

cleanup_old_debates() {
    log_info "Cleaning up old debates..."
    
    # Run cleanup script
    node packages/forum/dist/cli.js cleanup 30
    
    log_success "Cleanup complete"
}

backup_database() {
    log_info "Backing up database..."
    
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    pg_dump $DATABASE_URL > "backups/$BACKUP_FILE"
    
    log_success "Database backed up to backups/$BACKUP_FILE"
}

restore_database() {
    BACKUP_FILE=$1
    
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Please provide backup file"
        exit 1
    fi
    
    log_warning "Restoring database from $BACKUP_FILE..."
    read -p "This will overwrite current data. Continue? (yes/no) " -n 3 -r
    echo
    
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    psql $DATABASE_URL < "backups/$BACKUP_FILE"
    
    log_success "Database restored"
}

# ============================================================================
# MONITORING FUNCTIONS
# ============================================================================

check_health() {
    log_info "Checking system health..."
    
    # Check database
    if psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1; then
        log_success "Database: OK"
    else
        log_error "Database: FAILED"
    fi
    
    # Check WebSocket server
    if curl -s http://localhost:3001 > /dev/null; then
        log_success "WebSocket: OK"
    else
        log_warning "WebSocket: Not running"
    fi
    
    # Check API
    if curl -s http://localhost:3000/api/health > /dev/null; then
        log_success "API: OK"
    else
        log_warning "API: Not running"
    fi
}

show_logs() {
    SERVICE=$1
    
    case $SERVICE in
        api)
            tail -f packages/api/logs/api.log
            ;;
        ws)
            pm2 logs forum-ws
            ;;
        all)
            tail -f packages/api/logs/*.log
            ;;
        *)
            log_error "Unknown service: $SERVICE"
            log_info "Available services: api, ws, all"
            exit 1
            ;;
    esac
}

# ============================================================================
# MAIN
# ============================================================================

case "$1" in
    setup)
        setup_env
        setup_deps
        setup_db
        ;;
    build)
        build_all
        ;;
    test)
        test_all
        ;;
    typecheck)
        typecheck_all
        ;;
    deploy:staging)
        deploy_staging
        ;;
    deploy:prod)
        deploy_production
        ;;
    cleanup)
        cleanup_old_debates
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    health)
        check_health
        ;;
    logs)
        show_logs "$2"
        ;;
    *)
        echo "Forum Automation Scripts"
        echo ""
        echo "Usage: ./automation.sh <command> [options]"
        echo ""
        echo "Commands:"
        echo "  setup              Setup environment, deps, and database"
        echo "  build              Build all packages"
        echo "  test               Run all tests"
        echo "  typecheck          Type check all packages"
        echo "  deploy:staging     Deploy to staging"
        echo "  deploy:prod        Deploy to production"
        echo "  cleanup            Clean up old debates"
        echo "  backup             Backup database"
        echo "  restore <file>     Restore database from backup"
        echo "  health             Check system health"
        echo "  logs <service>     Show logs (api, ws, all)"
        echo ""
        exit 1
        ;;
esac
