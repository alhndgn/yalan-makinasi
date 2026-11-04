#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm install --save-dev --no-fund --no-audit \
  vite @vitejs/plugin-react tailwindcss @tailwindcss/vite \
  typescript vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @types/node @types/react @types/react-dom concurrently
