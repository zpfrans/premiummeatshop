# CORS Verification Script for Farmer's Premium Meatshop
# This script helps verify that the Pro plan upgrade fixed the backend-frontend communication

Write-Host "================================" -ForegroundColor Cyan
Write-Host "CORS Setup Verification" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Color functions
function Success { Write-Host $args -ForegroundColor Green }
function Error { Write-Host $args -ForegroundColor Red }
function Warning { Write-Host $args -ForegroundColor Yellow }
function Info { Write-Host $args -ForegroundColor Blue }

# Get URLs from user
Write-Host "Enter your Render URLs (found in Render dashboard):`n"
$backendUrl = Read-Host "Backend URL (e.g., https://farmerpremium-backend-xxxxx.onrender.com)"
$frontendUrl = Read-Host "Frontend URL (e.g., https://farmerpremiummeatshop.onrender.com)"

if (-not $backendUrl -or -not $frontendUrl) {
    Error "URLs are required!"
    exit 1
}

# Remove trailing slashes
$backendUrl = $backendUrl.TrimEnd('/')
$frontendUrl = $frontendUrl.TrimEnd('/')

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Step 1: Testing Backend Health" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

try {
    $healthResponse = Invoke-RestMethod -Uri "$backendUrl/api/health" -TimeoutSec 10
    if ($healthResponse.status -eq "ok") {
        Success "Backend is running and database connected!"
        Success "   Response: $($healthResponse | ConvertTo-Json)"
    } else {
        Warning "Backend running but database might have issues"
        Warning "   Response: $($healthResponse | ConvertTo-Json)"
    }
} catch {
    Error "Backend health check failed!"
    Error "   Error: $($_.Exception.Message)"
    Error "   - Is the backend URL correct?"
    Error "   - Is the backend service running?"
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Step 2: Checking CORS Configuration" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Info "Frontend URL: $frontendUrl"
Info "Backend URL:  $backendUrl`n"

Write-Host "CORS will allow requests from:" -ForegroundColor Magenta
Write-Host "  Frontend URL: $frontendUrl"
Write-Host "  All Vercel preview domains (*.vercel.app)"
Write-Host "  Mobile apps (no-origin requests)"
Write-Host ""

Write-Host "Render Configuration Status:" -ForegroundColor Magenta
Info "Backend: FRONTEND_ORIGINS should be set to:"
Info "         $frontendUrl`n"

Warning "IMPORTANT: Verify in Render dashboard:"
Warning "   - Backend service > Environment"
Warning "   - Check FRONTEND_ORIGINS is set to your frontend URL"
Warning "   - Check VITE_API_BASE_URL in Frontend service`n"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 3: Test from Frontend" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "To fully test the CORS setup:" -ForegroundColor Magenta
Write-Host "1. Open: $frontendUrl"
Write-Host "2. Press F12 (Open DevTools)"
Write-Host "3. Go to Console tab"
Write-Host "4. Look for red errors mentioning CORS or Access-Control"
Write-Host "5. Try performing an action (login, view products, place order)"
Write-Host "6. Check if requests succeed or fail with CORS errors`n"

Write-Host "Success signs:" -ForegroundColor Green
Write-Host "  No CORS errors in console"
Write-Host "  Can see products on homepage"
Write-Host "  Can log in successfully"
Write-Host "  Network tab shows API requests returning 200/201/202`n"

Write-Host "If you still see CORS errors:" -ForegroundColor Yellow
Write-Host "  1. Restart backend service in Render"
Write-Host "  2. Clear browser cache (Ctrl+Shift+Delete)"
Write-Host "  3. Try incognito window"
Write-Host "  4. Verify FRONTEND_ORIGINS variable is correctly set`n"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Verification Complete" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
