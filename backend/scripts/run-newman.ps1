$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Collection = Join-Path $Root "tests\Conduit.postman_collection.json"
$ApiUrl = if ($env:APIURL) { $env:APIURL } else { "http://localhost:3000/api" }
$User = "u$(Get-Random)"
$Email = "$User@mail.com"

Write-Host "Newman → $ApiUrl (user $User)"
npx --yes newman run $Collection `
  --delay-request 500 `
  --global-var "APIURL=$ApiUrl" `
  --global-var "USERNAME=$User" `
  --global-var "EMAIL=$Email" `
  --global-var "PASSWORD=password"
