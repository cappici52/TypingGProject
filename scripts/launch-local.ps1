param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$gameUrl = 'http://127.0.0.1:4173/'
Set-Location -LiteralPath $projectDirectory
$nodeBinary = (Get-Command node -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory 'local-dist/index.html'))) {
    Write-Host 'Building RUNEBLADE for local play...'
    & npm.cmd run build:local
    if ($LASTEXITCODE -ne 0) { throw 'Build failed. Run npm install, then try again.' }
}
$health = $null
try { $health = Invoke-RestMethod -Uri ($gameUrl + '__runeblade') -TimeoutSec 2 } catch { }
if ($null -eq $health) {
    $serverScript = Join-Path $projectDirectory 'scripts/local-server.mjs'
    Start-Process -FilePath $nodeBinary -ArgumentList ('"' + $serverScript + '"') -WorkingDirectory $projectDirectory -WindowStyle Hidden | Out-Null
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 200
        try { $health = Invoke-RestMethod -Uri ($gameUrl + '__runeblade') -TimeoutSec 1; break } catch { }
    }
}
if ($null -eq $health -or $health.app -ne 'runeblade-local') { throw 'RUNEBLADE could not start. Port 4173 may be used by another app. No other app was stopped.' }
if (-not $NoBrowser) { Start-Process $gameUrl }
