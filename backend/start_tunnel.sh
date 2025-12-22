#!/bin/bash

# Configuration
PORT=5006

echo "---------------------------------------------------"
echo "  Lancement du Tunnel CLOUDFLARE (Ultra Stable)"
echo "---------------------------------------------------"
echo "✅ PLUS DE MOT DE PASSE REQUIS !"
echo ""

# Lancement de Cloudflare Tunnel
echo "Starting Cloudflare Tunnel..."
echo "--> RECHERCHEZ L'URL (https://xxxx.trycloudflare.com) CI-DESSOUS :"
echo ""
./bin/cloudflared tunnel --config config.yml run granite-erp
