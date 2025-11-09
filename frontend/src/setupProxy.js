const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('[Proxy] Initializing proxy setup...');
  
  // Proxy tất cả requests bắt đầu với /api
  const proxyMiddleware = createProxyMiddleware({
    target: 'https://imeeet.onrender.com',
    changeOrigin: true, // QUAN TRỌNG: thay đổi origin header để backend nhận đúng
    secure: true, // Cho phép HTTPS
    ws: true, // Enable websocket proxying
    logLevel: 'debug', // Log chi tiết để debug
    onProxyReq: (proxyReq, req, res) => {
      // Log để debug
      console.log('[Proxy] ✅ Forwarding:', req.method, req.url, '-> https://imeeet.onrender.com' + req.url);
      // Đảm bảo headers được set đúng
      proxyReq.setHeader('Host', 'imeeet.onrender.com');
      proxyReq.setHeader('X-Forwarded-For', req.ip || req.connection.remoteAddress);
      proxyReq.setHeader('X-Forwarded-Proto', 'https');
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log response
      console.log('[Proxy] ✅ Response:', proxyRes.statusCode, 'for', req.url);
    },
    onError: (err, req, res) => {
      console.error('[Proxy] ❌ Error:', err.message);
      console.error('[Proxy] ❌ Error details:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Proxy error: ' + err.message,
          details: 'Request to ' + req.url + ' failed'
        });
      }
    }
  });
  
  // Apply proxy middleware
  app.use('/api', proxyMiddleware);
  
  console.log('[Proxy] ✅ Setup complete - proxying /api/* to https://imeeet.onrender.com');
};

