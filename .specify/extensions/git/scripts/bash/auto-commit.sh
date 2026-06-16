#!/usr/bin/env bash
# Git extension: auto-commit.sh
# Automatically commit changes after a Spec Kit command completes.
# Optionally push the result and wait for GitHub Actions checks.
#
# Usage: auto-commit.sh <event_name>
#   e.g.: auto-commit.sh after_specify

set -euo pipefail

EVENT_NAME="${1:-}"
if [ -z "$EVENT_NAME" ]; then
    echo "Usage: $0 <event_name>" >&2
    exit 1
fi

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_project_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.specify" ] || [ -d "$dir/.git" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

yaml_value() {
    local value
    value=$(printf '%s\n' "$1" | sed 's/^[^:]*:[[:space:]]*//' | sed 's/[[:space:]]#.*$//')
    value="${value%\"}"
    value="${value#\"}"
    printf '%s' "$value"
}

to_bool() {
    local value
    value=$(printf '%s' "$1" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
    [ "$value" = "true" ] && printf 'true' || printf 'false'
}

read_event_config() {
    local section="$1"
    local event_name="$2"
    CONFIG_ENABLED=false
    CONFIG_HAS_EVENT=false
    CONFIG_MESSAGE=""
    CONFIG_REMOTE="origin"
    CONFIG_WAIT_FOR_CHECKS=false
    CONFIG_WAIT_TIMEOUT_SECONDS=900
    CONFIG_POLL_INTERVAL_SECONDS=5

    local in_section=false
    local in_event=false
    local default_enabled=false
    local line key value

    while IFS= read -r line; do
        if printf '%s\n' "$line" | grep -Eq "^${section}:"; then
            in_section=true
            in_event=false
            continue
        fi

        if $in_section && printf '%s\n' "$line" | grep -Eq '^[A-Za-z0-9_]+:'; then
            break
        fi

        if ! $in_section; then
            continue
        fi

        if printf '%s\n' "$line" | grep -Eq '^[[:space:]]+default:[[:space:]]'; then
            value=$(yaml_value "$line")
            [ "$(to_bool "$value")" = "true" ] && default_enabled=true
            continue
        fi

        if printf '%s\n' "$line" | grep -Eq "^[[:space:]]+${event_name}:"; then
            CONFIG_HAS_EVENT=true
            in_event=true
            continue
        fi

        if ! $in_event; then
            continue
        fi

        if printf '%s\n' "$line" | grep -Eq '^[[:space:]]{2}[A-Za-z0-9_]+:' &&
            ! printf '%s\n' "$line" | grep -Eq '^[[:space:]]{4}'; then
            in_event=false
            continue
        fi

        if ! printf '%s\n' "$line" | grep -Eq '^[[:space:]]+[A-Za-z0-9_]+:'; then
            continue
        fi

        key=$(printf '%s\n' "$line" | sed -E 's/^[[:space:]]+([A-Za-z0-9_]+):.*/\1/')
        value=$(yaml_value "$line")
        case "$key" in
            enabled) CONFIG_ENABLED=$(to_bool "$value") ;;
            message) CONFIG_MESSAGE="$value" ;;
            remote) CONFIG_REMOTE="$value" ;;
            wait_for_checks) CONFIG_WAIT_FOR_CHECKS=$(to_bool "$value") ;;
            wait_timeout_seconds) CONFIG_WAIT_TIMEOUT_SECONDS="$value" ;;
            poll_interval_seconds) CONFIG_POLL_INTERVAL_SECONDS="$value" ;;
        esac
    done < "$CONFIG_FILE"

    if [ "$CONFIG_ENABLED" = "false" ] && [ "$default_enabled" = "true" ] && [ "$CONFIG_HAS_EVENT" = "false" ]; then
        CONFIG_ENABLED=true
    fi
}

github_repo_from_remote() {
    local remote="$1"
    local remote_url repo
    remote_url=$(git config --get "remote.${remote}.url" 2>/dev/null || true)

    case "$remote_url" in
        https://github.com/*)
            repo="${remote_url#https://github.com/}"
            repo="${repo%.git}"
            ;;
        git@github.com:*)
            repo="${remote_url#git@github.com:}"
            repo="${repo%.git}"
            ;;
        *)
            return 1
            ;;
    esac

    printf '%s' "$repo"
}

wait_for_github_checks() {
    local repo="$1"
    local sha="$2"
    local branch="$3"
    local timeout_seconds="$4"
    local interval_seconds="$5"
    local start now elapsed run_id

    if ! command -v gh >/dev/null 2>&1; then
        echo "[specify] Error: gh is required to wait for GitHub checks" >&2
        return 1
    fi

    echo "[specify] Waiting for GitHub Actions run for ${sha}" >&2
    start=$(date +%s)

    while true; do
        run_id=$(
            gh run list \
                --repo "$repo" \
                --commit "$sha" \
                --branch "$branch" \
                --event push \
                --limit 10 \
                --json databaseId \
                --jq '.[0].databaseId // empty' 2>/dev/null || true
        )

        if [ -n "$run_id" ]; then
            gh run watch "$run_id" --repo "$repo" --compact --exit-status --interval "$interval_seconds"
            return $?
        fi

        now=$(date +%s)
        elapsed=$((now - start))
        if [ "$elapsed" -ge "$timeout_seconds" ]; then
            echo "[specify] Error: timed out waiting for a GitHub Actions run for ${sha}" >&2
            return 1
        fi

        sleep "$interval_seconds"
    done
}

REPO_ROOT=$(find_project_root "$SCRIPT_DIR") || REPO_ROOT="$(pwd)"
cd "$REPO_ROOT"

if ! command -v git >/dev/null 2>&1; then
    echo "[specify] Warning: Git not found; skipped auto-commit" >&2
    exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[specify] Warning: Not a Git repository; skipped auto-commit" >&2
    exit 0
fi

CONFIG_FILE="$REPO_ROOT/.specify/extensions/git/git-config.yml"
if [ ! -f "$CONFIG_FILE" ]; then
    exit 0
fi

read_event_config "auto_commit" "$EVENT_NAME"
COMMIT_ENABLED="$CONFIG_ENABLED"
COMMIT_MESSAGE="$CONFIG_MESSAGE"

read_event_config "auto_push" "$EVENT_NAME"
PUSH_ENABLED="$CONFIG_ENABLED"
PUSH_REMOTE="$CONFIG_REMOTE"
PUSH_WAIT_FOR_CHECKS="$CONFIG_WAIT_FOR_CHECKS"
PUSH_WAIT_TIMEOUT_SECONDS="$CONFIG_WAIT_TIMEOUT_SECONDS"
PUSH_POLL_INTERVAL_SECONDS="$CONFIG_POLL_INTERVAL_SECONDS"

command_name=$(printf '%s' "$EVENT_NAME" | sed 's/^after_//' | sed 's/^before_//')
phase=$(printf '%s' "$EVENT_NAME" | grep -q '^before_' && echo 'before' || echo 'after')

if [ "$COMMIT_ENABLED" = "true" ]; then
    if [ -n "$(git status --porcelain)" ]; then
        if [ -z "$COMMIT_MESSAGE" ]; then
            COMMIT_MESSAGE="[Spec Kit] Auto-commit ${phase} ${command_name}"
        fi

        git add .
        git commit -q -m "$COMMIT_MESSAGE"
        echo "✓ Changes committed ${phase} ${command_name}" >&2
    else
        echo "[specify] No changes to commit after $EVENT_NAME" >&2
    fi
fi

if [ "$PUSH_ENABLED" != "true" ]; then
    exit 0
fi

current_branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)
if [ -z "$current_branch" ]; then
    echo "[specify] Error: cannot push from detached HEAD" >&2
    exit 1
fi

github_repo=$(github_repo_from_remote "$PUSH_REMOTE" || true)
if [ -z "$github_repo" ]; then
    echo "[specify] Error: remote '$PUSH_REMOTE' is not a GitHub remote" >&2
    exit 1
fi

current_sha=$(git rev-parse HEAD)
git push -u "$PUSH_REMOTE" HEAD
echo "✓ Pushed ${current_branch} to ${PUSH_REMOTE}" >&2

if [ "$PUSH_WAIT_FOR_CHECKS" = "true" ]; then
    wait_for_github_checks "$github_repo" "$current_sha" "$current_branch" "$PUSH_WAIT_TIMEOUT_SECONDS" "$PUSH_POLL_INTERVAL_SECONDS"
    echo "✓ GitHub checks passed for ${current_sha}" >&2
fi
