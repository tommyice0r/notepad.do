#!/bin/sh
set -e

CONFIG_FILE="/usr/share/nginx/html/config.js"
INDEX_FILE="/usr/share/nginx/html/index.html"
ADS_TXT_FILE="/usr/share/nginx/html/ads.txt"

ADSENSE_ID="${VITE_ADSENSE_CLIENT_ID:-$ADSENSE_CLIENT_ID}"

# Inject runtime environment variables configured in Dokploy
if [ -n "$VITE_API_URL" ]; then
  echo "[Notepad.do] Injecting runtime VITE_API_URL: $VITE_API_URL"
  cat <<EOF > "$CONFIG_FILE"
window.__APP_CONFIG__ = {
  VITE_API_URL: "$VITE_API_URL",
  VITE_ADSENSE_CLIENT_ID: "$ADSENSE_ID"
};
EOF
else
  echo "[Notepad.do] No runtime VITE_API_URL provided; defaulting to relative /api"
  cat <<EOF > "$CONFIG_FILE"
window.__APP_CONFIG__ = {
  VITE_API_URL: "",
  VITE_ADSENSE_CLIENT_ID: "$ADSENSE_ID"
};
EOF
fi

# If an AdSense Publisher ID is provided at runtime in Dokploy, inject into index.html <head> and ads.txt
if [ -n "$ADSENSE_ID" ]; then
  PUB_ID=$(echo "$ADSENSE_ID" | sed 's/^ca-//')
  CA_PUB_ID="ca-$PUB_ID"
  echo "[Notepad.do] Injecting Google AdSense ($CA_PUB_ID) into index.html and ads.txt"
  echo "google.com, $PUB_ID, DIRECT, f08c47fec0942fa0" > "$ADS_TXT_FILE"
  if [ -f "$INDEX_FILE" ] && ! grep -q "google-adsense-account" "$INDEX_FILE"; then
    sed -i "s|</head>|  <meta name=\"google-adsense-account\" content=\"$CA_PUB_ID\" />\n    <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=$CA_PUB_ID\" crossorigin=\"anonymous\" data-adsense-script=\"true\"></script>\n  </head>|" "$INDEX_FILE"
  fi
fi

