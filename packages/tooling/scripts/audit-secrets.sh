#!/usr/bin/env bash
# ==============================================================================
# scripts/audit-secrets.sh
# TASK-14: Secret Scanning & Leak Detection Automated Gate
# Scans git-tracked codebase for hardcoded private keys, JWT secrets,
# cloud API credentials, Supabase service roles, and PayOS keys.
# ==============================================================================

set -eo pipefail

echo "================================================================="
echo " [TASK-14] Monorepo Secret Scanning & Sanitization Audit"
echo "================================================================="

VIOLATIONS=0
CHECKED_FILES=0

# Define high-entropy & sensitive credential patterns
PATTERNS=(
  # Private keys (0x followed by 64 hex characters)
  '0x[a-fA-F0-9]{64}'
  # PEM private key blocks
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
  # Google Cloud / Gemini API Keys
  'AIza[0-9A-Za-z\\-_]{35}'
  # Supabase Service Role JWT
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
  # AWS Access Key ID
  'AKIA[0-9A-Z]{16}'
)

# Files to ignore (docs, examples, fixtures, generated ABIs, lockfiles)
EXCLUDE_FILTER='(\.env\.example$|STRUCTURE.*\.md$|package-lock\.json$|\.bin$|mock|fixtures|broadcast|DigitalEscrowABI\.ts$)'

echo "Scanning git-tracked files for secret patterns..."

for pattern in "${PATTERNS[@]}"; do
  # Search git tracked files
  MATCHES=$(git grep -E -I -n "$pattern" -- ':(exclude)*.env.example' ':(exclude)*.md' ':(exclude)*.lock' ':(exclude)*mock*' ':(exclude)*fixture*' 2>/dev/null || true)
  
  if [ -n "$MATCHES" ]; then
    echo ""
    echo "[SECURITY ALERT] Potential secret leak found for pattern: $pattern"
    echo "$MATCHES" | while read -r line; do
      echo "  -> $line"
    done
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

# Check for tracked .env files in git
echo "Checking git status for improperly tracked .env files..."
TRACKED_ENVS=$(git ls-files | grep -E '(^|/)\.env(\.[^/]+)?$' | grep -v '\.env\.example' || true)

if [ -n "$TRACKED_ENVS" ]; then
  echo ""
  echo "[SECURITY ERROR] The following live .env files are being tracked by git:"
  echo "$TRACKED_ENVS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "[PASS] Zero live .env files tracked in Git."
fi

# Summary
echo ""
echo "================================================================="
if [ $VIOLATIONS -gt 0 ]; then
  echo "[FAIL] Quality Gate Rejected: $VIOLATIONS potential secret leak(s) detected!"
  exit 1
else
  echo "[PASS] Secret Scanning Passed: Zero hardcoded secrets detected."
  exit 0
fi
