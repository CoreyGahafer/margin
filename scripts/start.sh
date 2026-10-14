#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export HF_HOME="$PWD/.model-cache"
if command -v uv >/dev/null 2>&1; then
  uv venv --python 3.11 .venv
  uv pip install --python .venv/bin/python -r server/requirements.txt
else
  python3 -m venv .venv
  .venv/bin/python -m pip install -r server/requirements.txt
fi
exec .venv/bin/python server/app.py
