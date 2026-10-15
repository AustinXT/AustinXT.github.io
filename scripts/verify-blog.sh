#!/bin/sh
# 在项目根运行；依赖按锁文件准备。完整验证可移交到 mac-offload。
set -eu
export NEXT_TELEMETRY_DISABLED=1
expected_node=$(cat src/site/.node-version)
test "$(node --version)" = "v$expected_node"
npm --prefix src/site ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org
mkdir -p _tmp/20261015-blog-verification
npm --prefix src/site ls --all > _tmp/20261015-blog-verification/dependency-tree.txt
npm --prefix src/site run lint
node --test scripts/test-content-loader.mjs scripts/test-search.mjs scripts/test-legacy-migration.mjs
node scripts/migrate-legacy-content.mjs --check-index
python3 -I scripts/test-site-export.py
python3 -I scripts/test-content-export.py
python3 -I scripts/test-migration.py
python3 -I scripts/check-migration.py
npm --prefix src/site run build
npm --prefix src/site run typecheck
python3 -I scripts/check-site-export.py
python3 -I scripts/check-content-export.py
