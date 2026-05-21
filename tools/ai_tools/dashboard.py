from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8123

print("Dashboard disponible en http://localhost:8123/docs/architecture/ARCHITECTURE.md")

HTTPServer(("localhost",PORT),SimpleHTTPRequestHandler).serve_forever()
