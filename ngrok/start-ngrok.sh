#!/bin/bash

# ngrok tunnel script for testing the local frontend
# Usage: ./start-ngrok.sh [port]
# Default port: 3000

PORT=${1:-3000}

echo "🚀 Starting ngrok tunnel for localhost:$PORT"
echo "================================================"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "ngrok is not installed."
    echo ""
    echo "Install ngrok using one of these methods:"
    echo "  - macOS (Homebrew): brew install ngrok"
    echo "  - Download from: https://ngrok.com/download"
    echo ""
    exit 1
fi

# Check if the frontend is running
if ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200"; then
    echo "Warning: localhost:$PORT doesn't seem to be responding."
    echo "   Make sure the frontend is running (npm run dev)"
    echo ""
fi

echo "Creating tunnel to http://localhost:$PORT"
echo "   Press Ctrl+C to stop the tunnel"
echo ""

# Start ngrok tunnel
ngrok http $PORT
