#!/usr/bin/env pwsh
# Git extension: auto-commit.ps1
# Automatically commit changes after a Spec Kit command completes.
# Optionally push the result and wait for GitHub Actions checks.
#
# Usage: auto-commit.ps1 <event_name>
#   e.g.: auto-commit.ps1 after_specify
param(
    [Parameter(Position = 0, Mandatory = $true)]
    [string]$EventName
)

$ErrorActionPreference = "Stop"

function Find-ProjectRoot {
    param([string]$StartDir)

    $current = Resolve-Path $StartDir
    while ($true) {
        foreach ($marker in @(".specify", ".git")) {
            if (Test-Path (Join-Path $current $marker)) {
                return $current
            }
        }

        $parent = Split-Path $current -Parent
        if ($parent -eq $current) {
            return $null
        }
        $current = $parent
    }
}

function Get-YamlValue {
    param([string]$Line)

    $value = $Line -replace "^[^:]*:\s*", ""
    $value = $value -replace "\s+#.*$", ""
    $value = $value.Trim()
    $value = $value -replace '^"', ""
    $value = $value -replace '"$', ""
    return $value
}

function Convert-ToBooleanString {
    param([string]$Value)

    if ($Value.Trim().ToLowerInvariant() -eq "true") {
        return "true"
    }
    return "false"
}

function Get-EventConfig {
    param(
        [string]$Section,
        [string]$EventName,
        [string]$ConfigFile
    )

    $config = @{
        Enabled = "false"
        HasEvent = "false"
        Message = ""
        Remote = "origin"
        WaitForChecks = "false"
        WaitTimeoutSeconds = 900
        PollIntervalSeconds = 5
    }

    $inSection = $false
    $inEvent = $false
    $defaultEnabled = $false
    $escapedEventName = [regex]::Escape($EventName)

    foreach ($line in Get-Content $ConfigFile) {
        if ($line -match "^$([regex]::Escape($Section)):") {
            $inSection = $true
            $inEvent = $false
            continue
        }

        if ($inSection -and $line -match "^[A-Za-z0-9_]+:") {
            break
        }

        if (-not $inSection) {
            continue
        }

        if ($line -match "^\s+default:\s*") {
            $value = Get-YamlValue $line
            if ((Convert-ToBooleanString $value) -eq "true") {
                $defaultEnabled = $true
            }
            continue
        }

        if ($line -match "^\s+$escapedEventName:") {
            $config.HasEvent = "true"
            $inEvent = $true
            continue
        }

        if (-not $inEvent) {
            continue
        }

        if (($line -match "^\s{2}[A-Za-z0-9_]+:") -and ($line -notmatch "^\s{4}")) {
            $inEvent = $false
            continue
        }

        if ($line -notmatch "^\s+[A-Za-z0-9_]+:") {
            continue
        }

        $key = $line -replace "^\s+([A-Za-z0-9_]+):.*", '$1'
        $value = Get-YamlValue $line
        switch ($key) {
            "enabled" { $config.Enabled = Convert-ToBooleanString $value }
            "message" { $config.Message = $value }
            "remote" { $config.Remote = $value }
            "wait_for_checks" { $config.WaitForChecks = Convert-ToBooleanString $value }
            "wait_timeout_seconds" { $config.WaitTimeoutSeconds = [int]$value }
            "poll_interval_seconds" { $config.PollIntervalSeconds = [int]$value }
        }
    }

    if (($config.Enabled -eq "false") -and $defaultEnabled -and ($config.HasEvent -eq "false")) {
        $config.Enabled = "true"
    }

    return $config
}

function Get-GitHubRepoFromRemote {
    param([string]$Remote)

    $remoteUrl = git config --get "remote.$Remote.url" 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $remoteUrl) {
        return $null
    }

    if ($remoteUrl -match "^https://github\.com/(.+?)(?:\.git)?$") {
        return $matches[1]
    }

    if ($remoteUrl -match "^git@github\.com:(.+?)(?:\.git)?$") {
        return $matches[1]
    }

    return $null
}

function Wait-GitHubChecks {
    param(
        [string]$Repo,
        [string]$Sha,
        [string]$Branch,
        [int]$TimeoutSeconds,
        [int]$IntervalSeconds
    )

    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw "gh is required to wait for GitHub checks"
    }

    Write-Host "[specify] Waiting for GitHub Actions run for $Sha"
    $startedAt = Get-Date

    while ($true) {
        $runId = gh run list `
            --repo $Repo `
            --commit $Sha `
            --branch $Branch `
            --event push `
            --limit 10 `
            --json databaseId `
            --jq '.[0].databaseId // empty' 2>$null

        if ($LASTEXITCODE -eq 0 -and $runId) {
            gh run watch $runId --repo $Repo --compact --exit-status --interval $IntervalSeconds
            if ($LASTEXITCODE -ne 0) {
                throw "GitHub checks failed for $Sha"
            }
            return
        }

        $elapsed = ((Get-Date) - $startedAt).TotalSeconds
        if ($elapsed -ge $TimeoutSeconds) {
            throw "Timed out waiting for a GitHub Actions run for $Sha"
        }

        Start-Sleep -Seconds $IntervalSeconds
    }
}

$repoRoot = Find-ProjectRoot -StartDir $PSScriptRoot
if (-not $repoRoot) {
    $repoRoot = Get-Location
}
Set-Location $repoRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Warning "[specify] Warning: Git not found; skipped auto-commit"
    exit 0
}

git rev-parse --is-inside-work-tree 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "[specify] Warning: Not a Git repository; skipped auto-commit"
    exit 0
}

$configFile = Join-Path $repoRoot ".specify/extensions/git/git-config.yml"
if (-not (Test-Path $configFile)) {
    exit 0
}

$commitConfig = Get-EventConfig -Section "auto_commit" -EventName $EventName -ConfigFile $configFile
$pushConfig = Get-EventConfig -Section "auto_push" -EventName $EventName -ConfigFile $configFile

$commandName = $EventName -replace "^after_", "" -replace "^before_", ""
$phase = if ($EventName -match "^before_") { "before" } else { "after" }

if ($commitConfig.Enabled -eq "true") {
    $status = git status --porcelain
    if ($status) {
        $commitMessage = $commitConfig.Message
        if (-not $commitMessage) {
            $commitMessage = "[Spec Kit] Auto-commit $phase $commandName"
        }

        git add .
        if ($LASTEXITCODE -ne 0) {
            throw "git add failed"
        }

        git commit -q -m $commitMessage
        if ($LASTEXITCODE -ne 0) {
            throw "git commit failed"
        }

        Write-Host "✓ Changes committed $phase $commandName"
    } else {
        Write-Host "[specify] No changes to commit after $EventName"
    }
}

if ($pushConfig.Enabled -ne "true") {
    exit 0
}

$currentBranch = git symbolic-ref --quiet --short HEAD 2>$null
if ($LASTEXITCODE -ne 0 -or -not $currentBranch) {
    throw "Cannot push from detached HEAD"
}

$githubRepo = Get-GitHubRepoFromRemote -Remote $pushConfig.Remote
if (-not $githubRepo) {
    throw "Remote '$($pushConfig.Remote)' is not a GitHub remote"
}

$currentSha = git rev-parse HEAD
if ($LASTEXITCODE -ne 0 -or -not $currentSha) {
    throw "Cannot determine current HEAD"
}

git push -u $pushConfig.Remote HEAD
if ($LASTEXITCODE -ne 0) {
    throw "git push failed"
}
Write-Host "✓ Pushed $currentBranch to $($pushConfig.Remote)"

if ($pushConfig.WaitForChecks -eq "true") {
    Wait-GitHubChecks `
        -Repo $githubRepo `
        -Sha $currentSha `
        -Branch $currentBranch `
        -TimeoutSeconds $pushConfig.WaitTimeoutSeconds `
        -IntervalSeconds $pushConfig.PollIntervalSeconds
    Write-Host "✓ GitHub checks passed for $currentSha"
}
