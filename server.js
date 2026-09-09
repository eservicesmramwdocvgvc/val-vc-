const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8898;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const WEB_ROOT = path.join(__dirname);

const serveFile = (res, filePath, contentType) => {
  const stream = fs.createReadStream(filePath);
  
  stream.on('error', (err) => {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found', 'utf-8');
    console.log('  404 Not Found');
  });
  
  stream.on('open', () => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error', 'utf-8');
        return;
      }

      const ext = String(path.extname(filePath)).toLowerCase();
      let cacheControl = 'public, max-age=3600';
      const headers = {
        'Content-Type': contentType,
        'Content-Length': stats.size
      };
      if (ext === '.json') {
        cacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      } else if (ext === '.html') {
        cacheControl = 'no-cache, must-revalidate';
      }
      headers['Cache-Control'] = cacheControl;
      
      res.writeHead(200, headers);
      stream.pipe(res);
      console.log('  200 OK');
    });
  });
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Allow': 'GET, HEAD'
    });
    res.end('405 Method Not Allowed', 'utf-8');
    console.log(`[${req.method}] ${req.url} -> 405 Method Not Allowed`);
    return;
  }

  const urlPath = req.url.split('?')[0].split('#')[0];
  const decodedPath = decodeURIComponent(urlPath);

  if (decodedPath.includes('..') || /[\\]/.test(decodedPath)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request', 'utf-8');
    console.log(`[${req.method}] ${req.url} -> 400 Bad Request (path traversal attempt)`);
    return;
  }

  const resolvedRoot = path.resolve(WEB_ROOT);
  const rawTarget = path.join(resolvedRoot, decodedPath === '/' ? 'index.html' : decodedPath);
  const filePath = path.resolve(rawTarget);

  if (!filePath.startsWith(resolvedRoot + path.sep) && filePath !== resolvedRoot) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request', 'utf-8');
    console.log(`[${req.method}] ${req.url} -> 400 Bad Request (escaped web root)`);
    return;
  }
  
  console.log(`[${req.method}] ${req.url}`);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Try adding .html if file not found
      fs.access(filePath + '.html', fs.constants.F_OK, (err2) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found', 'utf-8');
          console.log('  404 Not Found');
        } else {
          const ext = '.html';
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          serveFile(res, filePath + '.html', contentType);
        }
      });
    } else {
      const ext = String(path.extname(filePath)).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      serveFile(res, filePath, contentType);
    }
  });
});

server.on('clientError', (err, socket) => {
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop');
});
