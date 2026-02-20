#!/usr/bin/env python3
"""
Simple HTTP server to run the 3D models homepage.
Run this script and open http://localhost:8000 in your browser.
Accessible from mobile devices on the same network.
"""

import http.server
import socketserver
import webbrowser
import os
import socket

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow loading resources
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress default logging
        pass

def get_local_ip():
    """Get the local IP address for network access"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Bind to 0.0.0.0 to allow access from other devices on the network
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
        local_ip = get_local_ip()
        
        print("=" * 60)
        print(f"Server running!")
        print("=" * 60)
        print(f"Local access:  http://localhost:{PORT}/")
        print(f"Network access: http://{local_ip}:{PORT}/")
        print("=" * 60)
        print("\nTo preview on mobile:")
        print(f"1. Make sure your mobile device is on the same Wi-Fi network")
        print(f"2. Open http://{local_ip}:{PORT}/ on your mobile browser")
        print("=" * 60)
        print("\nPress Ctrl+C to stop the server")
        print("\nOpening browser...")
        webbrowser.open(f'http://localhost:{PORT}/index.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")

if __name__ == "__main__":
    main()



