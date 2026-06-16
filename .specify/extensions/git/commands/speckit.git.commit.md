---
description: "Auto-commit changes after a Spec Kit command completes, with optional push and GitHub checks waiting"
---

# Auto-Commit Changes

Automatically stage and commit all changes after a Spec Kit command completes. For configured events, push the resulting commit to GitHub and wait for GitHub Actions checks.

## Behavior

This command is invoked as a hook after (or before) core commands. It:

1. Determines the event name from the hook context (e.g., if invoked as an `after_specify` hook, the event is `after_specify`; if `before_plan`, the event is `before_plan`)
2. Checks `.specify/extensions/git/git-config.yml` for the `auto_commit` section
3. Looks up the specific event key to see if auto-commit is enabled
4. Falls back to `auto_commit.default` if no event-specific key exists
5. Uses the per-command `message` if configured, otherwise a default message
6. If enabled and there are uncommitted changes, runs `git add .` + `git commit`
7. Checks `.specify/extensions/git/git-config.yml` for the `auto_push` section
8. If enabled for the event, pushes `HEAD` to the configured remote
9. If `wait_for_checks` is enabled, waits for the GitHub Actions run for the pushed commit and fails if checks fail

## Execution

Determine the event name from the hook that triggered this command, then run the script:

- **Bash**: `.specify/extensions/git/scripts/bash/auto-commit.sh <event_name>`
- **PowerShell**: `.specify/extensions/git/scripts/powershell/auto-commit.ps1 <event_name>`

Replace `<event_name>` with the actual hook event (e.g., `after_specify`, `before_plan`, `after_implement`).

## Configuration

In `.specify/extensions/git/git-config.yml`:

```yaml
auto_commit:
  default: false          # Global toggle — set true to enable for all commands
  after_specify:
    enabled: true          # Override per-command
    message: "[Spec Kit] Add specification"
  after_plan:
    enabled: false
    message: "[Spec Kit] Add implementation plan"

auto_push:
  default: false
  after_implement:
    enabled: true
    remote: origin
    wait_for_checks: true
    wait_timeout_seconds: 900
    poll_interval_seconds: 5
```

## Graceful Degradation

- If Git is not available or the current directory is not a repository: skips with a warning
- If no config file exists: skips (disabled by default)
- If no changes to commit: skips with a message
- If auto-push is enabled but the configured remote is not a GitHub remote: fails with a clear error
- If `wait_for_checks` is enabled but `gh` is unavailable or checks fail: fails with a clear error
