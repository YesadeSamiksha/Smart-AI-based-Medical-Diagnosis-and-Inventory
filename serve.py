#!/usr/bin/env python3
"""
No-cache HTTP server for MedAI development.
Disables all caching so the browser always loads fresh files.
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

    def send_header(self, keyword, value):
        # Strip ETag and Last-Modified to prevent 304 responses
        if keyword.lower() in ('etag', 'last-modified'):
            return
        super().send_header(keyword, value)

    def log_message(self, format, *args):
        super().log_message(format, *args)

with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    print(f'[OK] MedAI Dev Server running at http://localhost:{PORT}')
    print(f'[NO-CACHE] Browser will always load fresh files')
    print(f'Press Ctrl+C to stop.')
    httpd.serve_forever()
