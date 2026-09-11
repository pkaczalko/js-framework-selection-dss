$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
Write-Host "Reset volume Postgres + ponowny start API"
docker compose down -v
docker compose up --build -d
Write-Host "Czekam na http://localhost:3000/api/tags ..."
$ok = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    $res = Invoke-WebRequest -Uri "http://localhost:3000/api/tags" -UseBasicParsing -TimeoutSec 3
    if ($res.StatusCode -eq 200) { $ok = $true; break }
  } catch { }
  Start-Sleep -Seconds 2
}
if (-not $ok) { throw "API nie odpowiedziało w 120 s" }
Write-Host "API gotowe."
