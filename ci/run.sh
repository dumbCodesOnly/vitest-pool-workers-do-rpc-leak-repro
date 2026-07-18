#!/usr/bin/env bash
# All actual CI logic lives here, NOT in .github/workflows/repro.yml.
# The workflow file is a permanent thin wrapper that just calls this script,
# so future changes only need edits here (editable directly via API,
# unlike .github/workflows/* which needs the `workflow` OAuth scope).
set -uo pipefail

npm install

echo "=== source context around leak site (pre-patch) ==="
sed -n '300,420p' node_modules/@cloudflare/vitest-pool-workers/dist/worker/lib/cloudflare/test-internal.mjs | cat -n

echo "=== applying patch ==="
node ci/patch-fix.cjs

echo "=== vitest run ==="
export NODE_OPTIONS="--trace-warnings"
export NODE_DEBUG="vitest-pool-workers"
npx vitest run 2>&1 | tee repro.log
exit "${PIPESTATUS[0]}"
