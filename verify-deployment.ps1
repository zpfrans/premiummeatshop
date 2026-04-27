# Production deployment verification script (Windows PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File .\verify-deployment.ps1

$passed = 0
$failed = 0
$warnings = 0

function Check-Pass {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
    $script:passed++
}

function Check-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:failed++
}

function Check-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
    $script:warnings++
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Production Deployment Verification" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1) Tooling
Write-Host "1. Tooling checks" -ForegroundColor Cyan
Write-Host "---"
try { Check-Pass "Node.js: $(node --version)" } catch { Check-Fail "Node.js not installed" }
try { Check-Pass "npm: v$(npm --version)" } catch { Check-Fail "npm not installed" }
try { Check-Pass "$(git --version)" } catch { Check-Fail "Git not installed" }
Write-Host ""

# 2) Repository
Write-Host "2. Repository checks" -ForegroundColor Cyan
Write-Host "---"
if (Test-Path ".git") {
    Check-Pass "Git repository initialized"
    $gitStatus = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Check-Pass "Working tree clean"
    } else {
        Check-Warn "Working tree has uncommitted changes"
    }
} else {
    Check-Fail "Not a git repository"
}
Write-Host ""

# 3) Environment files
Write-Host "3. Environment checks" -ForegroundColor Cyan
Write-Host "---"
if (Test-Path "Backend\.env") {
    Check-Pass "Backend/.env exists"
    $backendEnv = Get-Content "Backend\.env" -Raw
    if ($backendEnv -match "DATABASE_URL=") { Check-Pass "DATABASE_URL present" } else { Check-Fail "DATABASE_URL missing" }
    if ($backendEnv -match "JWT_SECRET=") {
        if ($backendEnv -match "dev_secret|change_this|changeme|default") {
            Check-Warn "JWT_SECRET appears non-production"
        } else {
            Check-Pass "JWT_SECRET present"
        }
    } else {
        Check-Fail "JWT_SECRET missing"
    }
    if ($backendEnv -match "ADMIN_SEED_PASSWORD=") { Check-Pass "ADMIN_SEED_PASSWORD present" } else { Check-Fail "ADMIN_SEED_PASSWORD missing" }
} else {
    Check-Fail "Backend/.env missing"
}

if (Test-Path "frontend\.env") {
    Check-Pass "frontend/.env exists"
    $frontendEnv = Get-Content "frontend\.env" -Raw
    if ($frontendEnv -match "VITE_API_BASE_URL=") { Check-Pass "VITE_API_BASE_URL present" } else { Check-Fail "VITE_API_BASE_URL missing" }
} else {
    Check-Fail "frontend/.env missing"
}
Write-Host ""

# 4) Security baseline files
Write-Host "4. Security baseline checks" -ForegroundColor Cyan
Write-Host "---"
if (Test-Path ".gitignore") {
    Check-Pass ".gitignore exists"
    $gitignore = Get-Content ".gitignore" -Raw
    if ($gitignore -match "(^|\r?\n)\.env($|\r?\n)") {
        Check-Pass ".env ignored in git"
    } else {
        Check-Warn ".env not explicitly ignored in root .gitignore"
    }
} else {
    Check-Fail ".gitignore missing"
}
Write-Host ""

# 5) Dependency/install checks
Write-Host "5. Dependency checks" -ForegroundColor Cyan
Write-Host "---"
if (Test-Path "Backend\package.json") { Check-Pass "Backend/package.json exists" } else { Check-Fail "Backend/package.json missing" }
if (Test-Path "frontend\package.json") { Check-Pass "frontend/package.json exists" } else { Check-Fail "frontend/package.json missing" }
if (Test-Path "Backend\node_modules") { Check-Pass "Backend/node_modules installed" } else { Check-Warn "Backend/node_modules missing" }
if (Test-Path "frontend\node_modules") { Check-Pass "frontend/node_modules installed" } else { Check-Warn "frontend/node_modules missing" }
Write-Host ""

# 6) Deployment artifacts
Write-Host "6. Deployment artifact checks" -ForegroundColor Cyan
Write-Host "---"
if (Test-Path "render.yaml") { Check-Pass "render.yaml exists" } else { Check-Fail "render.yaml missing" }
if (Test-Path "docker-compose.yml") { Check-Pass "docker-compose.yml exists" } else { Check-Warn "docker-compose.yml missing" }
if (Test-Path "Backend\Dockerfile") { Check-Pass "Backend/Dockerfile exists" } else { Check-Fail "Backend/Dockerfile missing" }
if (Test-Path "frontend\Dockerfile") { Check-Pass "frontend/Dockerfile exists" } else { Check-Fail "frontend/Dockerfile missing" }
Write-Host ""

# 7) Database assets
Write-Host "7. Database checks" -ForegroundColor Cyan
Write-Host "---"
if (Test-Path "Backend\migrations") { Check-Pass "Backend/migrations exists" } else { Check-Fail "Backend/migrations missing" }
if (Test-Path "Backend\scripts\backup-postgres.ps1") { Check-Pass "backup script exists" } else { Check-Warn "backup script missing" }
if (Test-Path "Backend\scripts\restore-postgres.ps1") { Check-Pass "restore script exists" } else { Check-Warn "restore script missing" }
Write-Host ""

# 8) Docs
Write-Host "8. Documentation checks" -ForegroundColor Cyan
Write-Host "---"
$docs = @(
    "README.md",
    "START_HERE.md",
    "COMPLETE_SETUP_GUIDE.md",
    "GITHUB_AND_RENDER_QUICKSTART.md",
    "SECURITY_HARDENING.md",
    "PRODUCTION_CHECKLIST.md",
    "PRODUCTION_VERIFICATION_CHECKLIST.md"
)
foreach ($doc in $docs) {
    if (Test-Path $doc) { Check-Pass "$doc exists" } else { Check-Warn "$doc missing" }
}
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Passed:   $passed" -ForegroundColor Green
Write-Host "Failed:   $failed" -ForegroundColor Red
Write-Host "Warnings: $warnings" -ForegroundColor Yellow
Write-Host ""

if ($failed -eq 0) {
    Write-Host "[READY] All critical checks passed." -ForegroundColor Green
    Write-Host "Review warnings before production release." -ForegroundColor Yellow
    exit 0
}

Write-Host "[BLOCKED] Fix failures before deploying." -ForegroundColor Red
exit 1
