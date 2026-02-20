#!/bin/bash
# Start server with ngrok tunnel for mobile access (bypasses firewall)

PORT=8000

echo "============================================================"
echo "Starting server with ngrok tunnel..."
echo "============================================================"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "Error: ngrok is not installed."
    echo ""
    echo "To install ngrok:"
    echo "1. Visit https://ngrok.com/download"
    echo "2. Download and install ngrok"
    echo "3. Or use Homebrew: brew install ngrok"
    echo ""
    echo "Alternative: Use the regular server.py and configure your firewall"
    exit 1
fi

# Start Python server in background
echo "Starting local server on port $PORT..."
python3 -m http.server $PORT --bind 0.0.0.0 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Start ngrok tunnel
echo "Starting ngrok tunnel..."
echo ""
ngrok http $PORT

# Cleanup when script exits
trap "kill $SERVER_PID 2>/dev/null" EXIT

