# Script untuk mengganti semua instance 'http://localhost:4000' dengan `${API_BASE_URL}`
# di frontend source code

Write-Host "Updating remaining API URLs..." -ForegroundColor Cyan

$files = @(
    "frontend\src\components\Dashboard.jsx",
    "frontend\src\components\Autogroup.jsx",
    "frontend\src\components\Riwayat.jsx",
    "frontend\src\components\Kriteria.jsx",
    "frontend\src\components\KoordinatorPPM.jsx",
    "frontend\src\components\Step3_Results.jsx",
    "frontend\src\components\HeaderLocations.jsx",
    "frontend\src\components\ManajemenAkun.jsx",
    "frontend\src\components\PeriodeModal.jsx",
    "frontend\src\components\Profil.jsx",
    "frontend\src\components\Lokasi.jsx"
)

$count = 0

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        
        # Replace all variations
        $newContent = $content -replace "http://localhost:4000", "`${API_BASE_URL}"
        
        if ($content -ne $newContent) {
            Set-Content -Path $fullPath -Value $newContent -NoNewline -Encoding UTF8
            Write-Host "[OK] Updated: $file" -ForegroundColor Green
            $count++
        } else {
            Write-Host "[  ] No changes needed: $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "[!!] File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Update complete! $count files modified." -ForegroundColor Cyan
Write-Host "Verifying remaining instances..." -ForegroundColor Cyan

# Verify
$remainingCount = 0
foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        $matches = ([regex]::Matches($content, "localhost:4000")).Count
        if ($matches -gt 0) {
            Write-Host "[!!] Still has $matches instances: $file" -ForegroundColor Yellow
            $remainingCount += $matches
        }
    }
}

Write-Host ""
if ($remainingCount -eq 0) {
    Write-Host "SUCCESS: All API URLs updated successfully!" -ForegroundColor Green
} else {
    Write-Host "WARNING: $remainingCount instances remaining" -ForegroundColor Yellow
}
