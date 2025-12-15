#!/bin/bash

# Configuration
PORT=5006

echo "---------------------------------------------------"
echo "  Lancement du Tunnel CLOUDFLARE (Ultra Stable)"
echo "---------------------------------------------------"
echo "✅ PLUS DE MOT DE PASSE REQUIS !"
echo ""

# Lancement de Localtunnel (Legacy)
echo "Starting Localtunnel..."
echo "--> RECHERCHEZ L'URL (https://xxxx.loca.lt) CI-DESSOUS :"
echo ""
lt --port $PORT --subdomain $SUBDOMAIN
