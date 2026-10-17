#!/bin/sh
set -e

CONFIG_FILE="/usr/share/nginx/html/config.js"

# Inject runtime environment variables configured in Dokploy
if [ -n "$VITE_API_URL" ]; then
  echo "[Notepad Admin] Injecting runtime VITE_API_URL: $VITE_API_URL"
  cat <<EOF > "$CONFIG_FILE"
window.__APP_CONFIG__ = {
  VITE_API_URL: "$VITE_API_URL"
};
EOF
else
  echo "[Notepad Admin] No runtime VITE_API_URL provided; defaulting to relative /api"
  cat <<EOF > "$CONFIG_FILE"
window.__APP_CONFIG__ = {
  VITE_API_URL: ""
};
EOF
fi
