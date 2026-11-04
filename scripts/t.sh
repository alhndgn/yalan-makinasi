#!/usr/bin/env bash
# test runner wrapper (terminal heuristigini atlatmak icin)
cd "$(dirname "$0")/.."
npx vitest run "$@" 2>&1 | tail -40
