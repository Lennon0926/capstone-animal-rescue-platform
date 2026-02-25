#!/bin/bash

# ngrok tunnel script for testing the local frontend
# Usage: ./start-ngrok.sh [port]
# Default port: 3000

PORT=${1:-3000}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$PROJECT_DIR/apps/web"

echo "Starting ngrok tunnel for localhost:$PORT"
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

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "   Frontend stopped"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if the frontend is running, if not start it
if ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null | grep -q "200"; then
    echo "📦 Frontend not running. Starting it now..."
    echo ""
    
    # Check if client directory exists
    if [ ! -d "$CLIENT_DIR" ]; then
        echo "Client directory not found at: $CLIENT_DIR"
        exit 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "$CLIENT_DIR/node_modules" ]; then
        echo "Installing dependencies..."
        cd "$CLIENT_DIR" && npm install
    fi
    
    # Kill any existing next dev processes and clean lock
    pkill -f "next dev" 2>/dev/null
    rm -rf "$CLIENT_DIR/.next/dev/lock" 2>/dev/null
    sleep 1
    
    # Start the frontend in the background
    echo "Starting frontend server..."
    cd "$CLIENT_DIR" && npm run dev &
    FRONTEND_PID=$!
    
    # Wait for the server to be ready
    echo "⏳ Waiting for frontend to be ready..."
    MAX_ATTEMPTS=30
    ATTEMPT=0
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null | grep -q "200"; then
            echo "Frontend is ready!"
            break
        fi
        sleep 1
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo "Frontend failed to start within ${MAX_ATTEMPTS}s"
        cleanup
        exit 1
    fi
    echo ""
else
    echo "Frontend already running on port $PORT"
fi

echo "Creating tunnel to http://localhost:$PORT"
echo "   Press Ctrl+C to stop the tunnel and frontend"
echo ""

# Start ngrok tunnel
ngrok http $PORT
