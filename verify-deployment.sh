#!/bin/bash
# Production Deployment Verification Script
# Run this before deploying to production

echo "=================================================="
echo "🔍 Production Deployment Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠ WARN:${NC} $1"
    ((WARNINGS++))
}

echo "1. Checking Node.js & Git..."
echo "---"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm installed: $NPM_VERSION"
else
    check_fail "npm not installed"
fi

# Check git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git -v)
    check_pass "$GIT_VERSION"
else
    check_fail "Git not installed"
fi

echo ""
echo "2. Checking Repository..."
echo "---"

# Check git repository
if [ -d .git ]; then
    check_pass "Git repository initialized"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        check_warn "Uncommitted changes in repository"
    else
        check_pass "All changes committed"
    fi
else
    check_fail "Not a git repository (run: git init)"
fi

echo ""
echo "3. Checking .env Configuration..."
echo "---"

# Check backend .env
if [ -f backend/.env ]; then
    check_pass "backend/.env exists"
    
    # Check for required variables
    if grep -q "DATABASE_URL" backend/.env; then
        check_pass "DATABASE_URL configured"
    else
        check_fail "DATABASE_URL not configured"
    fi
    
    if grep -q "JWT_SECRET" backend/.env; then
        if grep -q "change_this\|dev_secret" backend/.env; then
            check_warn "JWT_SECRET using dev value (OK for dev, change for prod)"
        else
            check_pass "JWT_SECRET configured"
        fi
    else
        check_fail "JWT_SECRET not configured"
    fi
    
    if grep -q "ADMIN_SEED_PASSWORD" backend/.env; then
        check_pass "ADMIN_SEED_PASSWORD configured"
    else
        check_fail "ADMIN_SEED_PASSWORD not configured"
    fi
else
    check_fail "backend/.env not found (copy from .env.example)"
fi

# Check frontend .env
if [ -f frontend/.env ]; then
    check_pass "frontend/.env exists"
    
    if grep -q "VITE_API_BASE_URL" frontend/.env; then
        check_pass "VITE_API_BASE_URL configured"
    else
        check_fail "VITE_API_BASE_URL not configured"
    fi
else
    check_fail "frontend/.env not found (copy from .env.example)"
fi

echo ""
echo "4. Checking .gitignore..."
echo "---"

# Check .gitignore
if [ -f .gitignore ]; then
    check_pass ".gitignore exists"
    
    if grep -q "\.env" .gitignore; then
        check_pass ".env added to .gitignore"
    else
        check_fail ".env NOT in .gitignore (security risk!)"
    fi
else
    check_fail ".gitignore not found"
fi

echo ""
echo "5. Checking Dependencies..."
echo "---"

# Backend dependencies
if [ -f backend/package.json ]; then
    check_pass "backend/package.json exists"
    
    if [ -d backend/node_modules ]; then
        check_pass "backend/node_modules installed"
    else
        check_warn "backend/node_modules not installed (run: cd backend && npm install)"
    fi
else
    check_fail "backend/package.json not found"
fi

# Frontend dependencies
if [ -f frontend/package.json ]; then
    check_pass "frontend/package.json exists"
    
    if [ -d frontend/node_modules ]; then
        check_pass "frontend/node_modules installed"
    else
        check_warn "frontend/node_modules not installed (run: cd frontend && npm install)"
    fi
else
    check_fail "frontend/package.json not found"
fi

echo ""
echo "6. Checking Deployment Files..."
echo "---"

if [ -f render.yaml ]; then
    check_pass "render.yaml exists"
else
    check_fail "render.yaml not found (needed for Render deployment)"
fi

if [ -f docker-compose.yml ]; then
    check_pass "docker-compose.yml exists"
else
    check_warn "docker-compose.yml not found"
fi

if [ -f backend/Dockerfile ]; then
    check_pass "backend/Dockerfile exists"
else
    check_fail "backend/Dockerfile not found"
fi

if [ -f frontend/Dockerfile ]; then
    check_pass "frontend/Dockerfile exists"
else
    check_fail "frontend/Dockerfile not found"
fi

echo ""
echo "7. Checking Database Scripts..."
echo "---"

if [ -f backend/scripts/backup-postgres.sh ]; then
    check_pass "backup-postgres.sh exists"
else
    check_fail "backup-postgres.sh not found"
fi

if [ -f backend/scripts/restore-postgres.sh ]; then
    check_pass "restore-postgres.sh exists"
else
    check_fail "restore-postgres.sh not found"
fi

if [ -f backend/migrations ]; then
    check_pass "Database migrations directory exists"
else
    check_fail "Database migrations directory missing"
fi

echo ""
echo "8. Checking Documentation..."
echo "---"

DOCS=("README.md" "START_HERE.md" "COMPLETE_SETUP_GUIDE.md" "GITHUB_AND_RENDER_QUICKSTART.md" "SECURITY_HARDENING.md" "PRODUCTION_CHECKLIST.md" "PRODUCTION_VERIFICATION_CHECKLIST.md")

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$doc exists"
    else
        check_warn "$doc not found"
    fi
done

echo ""
echo "=================================================="
echo "📊 Verification Summary"
echo "=================================================="
echo -e "Passed:  ${GREEN}$PASSED${NC}"
echo -e "Failed:  ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review any warnings above"
    echo "2. Test locally: cd backend && npm run dev"
    echo "3. In another terminal: cd frontend && npm run dev"
    echo "4. Place a test order and verify admin flow"
    echo "5. Push to GitHub: git push origin main"
    echo "6. Deploy on Render using blueprint"
else
    echo -e "${RED}✗ Fix the failures above before deploying${NC}"
    exit 1
fi
