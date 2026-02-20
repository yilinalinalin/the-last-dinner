#!/bin/bash
# Simple script to start a local server accessible from mobile devices

# Function to get local IP address
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "localhost"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        hostname -I | awk '{print $1}' || echo "localhost"
    else
        echo "localhost"
    fi
}

LOCAL_IP=$(get_local_ip)
PORT=8000

echo "============================================================"
echo "Starting local server..."
echo "============================================================"
echo "Local access:  http://localhost:$PORT"
echo "Network access: http://$LOCAL_IP:$PORT"
echo "============================================================"
echo ""
echo "To preview on mobile:"
echo "1. Make sure your mobile device is on the same Wi-Fi network"
echo "2. Open http://$LOCAL_IP:$PORT/ on your mobile browser"
echo "============================================================"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first
if command -v python3 &> /dev/null; then
    # Use 0.0.0.0 to bind to all interfaces
    python3 -m http.server $PORT --bind 0.0.0.0
# Fall back to Python 2
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
# Try Node.js http-server if available
elif command -v npx &> /dev/null; then
    npx http-server -p $PORT -a 0.0.0.0
else
    echo "Error: No suitable server found."
    echo "Please install Python 3 or Node.js"
    exit 1
fi



