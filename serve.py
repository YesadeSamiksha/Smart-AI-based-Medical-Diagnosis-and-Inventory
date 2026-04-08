#!/usr/bin/env python3
"""
No-cache HTTP server for MedAI development.
Sends Cache-Control: no-store headers to prevent browser caching.
"""
import http.server
import socketserver

PORT = 8080

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Only log non-200 responses to reduce noise
        if args[1] != '200':
            super().log_message(format, *args)

with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    print(f'✅ MedAI Dev Server running at http://localhost:{PORT}')
    print(f'📡 No-cache mode: browser will always load fresh files')
    print(f'Press Ctrl+C to stop.')
    httpd.serve_forever()
