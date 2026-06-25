#!/usr/bin/env bash
set -euo pipefail

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
MODEL="${OLLAMA_MODEL:-llama3.2}"

echo "=== Ollama API ==="
if ! curl -sf "${OLLAMA_URL}/api/tags" >/dev/null; then
  echo "FAIL: Ollama not reachable at ${OLLAMA_URL}"
  echo "Install: curl -fsSL https://ollama.com/install.sh | sh"
  exit 1
fi
echo "OK: Ollama reachable at ${OLLAMA_URL}"

echo ""
echo "=== Models ==="
curl -sf "${OLLAMA_URL}/api/tags" | python3 -c "
import json, sys
data = json.load(sys.stdin)
models = [m.get('name', '') for m in data.get('models', [])]
if len(models) == 0:
    print('WARN: no models pulled yet — run: ollama pull ${MODEL}')
else:
    for name in models:
        print(f'  - {name}')
"

echo ""
echo "=== GPU memory before generation ==="
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader 2>/dev/null || echo "WARN: nvidia-smi not available"

echo ""
echo "=== Test generation (model=${MODEL}) ==="
curl -sf "${OLLAMA_URL}/api/chat" \
  -H 'Content-Type: application/json' \
  -d "{\"model\":\"${MODEL}\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hi in one word.\"}],\"stream\":false}" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
content = data.get('message', {}).get('content', '')
print(f'Response: {content[:80]}')
"

echo ""
echo "=== GPU memory after generation ==="
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader 2>/dev/null || true

echo ""
echo "If memory.used increased above ~500 MiB during generation, the GPU is likely in use."
echo "Also check: ollama ps"
