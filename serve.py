#!/usr/bin/env python3
"""Simple HTTP server with no-cache headers for local development."""
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3456

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # suppress request logs

with http.server.HTTPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving on http://localhost:{PORT}")
    httpd.serve_forever()
