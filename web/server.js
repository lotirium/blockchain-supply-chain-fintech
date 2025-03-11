const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle favicon.ico requests
  if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Normalize file path and handle root path
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

  // Get file extension and content type
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // For client-side routing, serve index.html for all non-file requests
        if (!extname) {
          fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
            if (err) {
              res.writeHead(500);
              res.end('Error loading index.html');
              console.error('Error serving index.html:', err);
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content, 'utf-8');
            }
          });
          return;
        }
        
        res.writeHead(404);
        res.end(`File not found: ${req.url}`);
        console.error('File not found:', filePath);
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
        console.error('Server error:', error);
      }
    } else {
      // Enable CORS for local development
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    }
  });
});

// Start the server
server.listen(PORT, '192.168.0.9', () => {
  console.log(`Server is running at http://192.168.0.9:${PORT}/`);
  console.log(`Serving files from: ${path.join(__dirname, 'public')}`);
});