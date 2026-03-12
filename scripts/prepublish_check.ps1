param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

Push-Location $RepoRoot
try {
    $failures = New-Object System.Collections.Generic.List[string]

    $trackedFiles = @(git ls-files)
    if ($LASTEXITCODE -ne 0) {
        throw 'git ls-files failed.'
    }

    $blockedPathPatterns = @(
        '^chromadb_store(?:/|$)',
        '^\.venv(?:/|$)',
        '^venv(?:/|$)',
        '^env(?:/|$)',
        '^frontend/dist(?:/|$)',
        '(^|/)\.env($|\.)',
        '\.(sqlite|sqlite3|db|log)$'
    )

    foreach ($tracked in $trackedFiles) {
        foreach ($pattern in $blockedPathPatterns) {
            if ($tracked -match $pattern) {
                $failures.Add("Tracked sensitive/local artifact detected: $tracked")
                break
            }
        }
    }

    $suspiciousContentPattern = '(?i)(api[_-]?key\s*[:=]|client[_-]?secret\s*[:=]|authorization\s*[:=]\s*["'']?bearer|BEGIN [A-Z ]+ PRIVATE KEY|password\s*[:=])'
    foreach ($tracked in $trackedFiles) {
        if ($tracked -match '^frontend/dist/' -or $tracked -match '^\.venv/' -or $tracked -match '^chromadb_store/') {
            continue
        }

        $absolutePath = Join-Path $RepoRoot $tracked
        if (-not (Test-Path $absolutePath -PathType Leaf)) {
            continue
        }

        $content = Get-Content -Path $absolutePath -Raw -ErrorAction SilentlyContinue
        if ($null -ne $content -and $content -match $suspiciousContentPattern) {
            $failures.Add("Potential secret-like content detected in tracked file: $tracked")
        }
    }

    if (Test-Path (Join-Path $RepoRoot 'chromadb_store')) {
        Write-Host 'Local vector database folder exists: chromadb_store' -ForegroundColor Yellow
        Write-Host 'This folder is ignored by git and docker build context, but remove it before archiving/share-by-zip if it contains private documents.' -ForegroundColor Yellow
    }

    if ($failures.Count -gt 0) {
        Write-Host 'Prepublish check failed:' -ForegroundColor Red
        $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
        exit 1
    }

    Write-Host 'Prepublish check passed: no tracked vector DB, env file, venv, build output, or obvious secret markers found.' -ForegroundColor Green
    exit 0
}
finally {
    Pop-Location
}