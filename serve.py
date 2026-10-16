"""Local dev server for Hai Maiaaa.

Serves this folder with caching turned off, so a normal reload always shows
your latest edits (plain `python3 -m http.server` lets the browser cache the
JS modules, which hides changes to the 3D world).

    python3 serve.py          # http://127.0.0.1:8800
    python3 serve.py 9000     # custom port
"""
import http.server
import os
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8800
    root = os.path.dirname(os.path.abspath(__file__))
    handler = lambda *a, **k: NoCache(*a, directory=root, **k)
    print(f'Serving {root}\n  dashboard: http://127.0.0.1:{port}/index.html\n  meadow:    http://127.0.0.1:{port}/world.html')
    http.server.ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
