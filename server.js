const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

// 导入API处理函数
const recognizeHandler = require('./api/recognize.js').default;

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API路由
  if (pathname === '/api/recognize') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const mockReq = {
          method: req.method,
          body: JSON.parse(body)
        };
        const mockRes = {
          setHeader: (key, value) => res.setHeader(key, value),
          status: (code) => ({
            json: (data) => {
              res.writeHead(code, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));
            },
            end: () => {
              res.writeHead(code);
              res.end();
            }
          }),
          json: (data) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          }
        };
        await recognizeHandler(mockReq, mockRes);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // 静态文件服务
  let filePath = pathname === '/' ? '/public/index.html' : pathname;
  if (filePath.startsWith('/public/')) {
    filePath = filePath.substring(7); // 移除 /public 前缀
  }
  filePath = path.join(__dirname, 'public', filePath);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('File not found');
    return;
  }

  // 设置内容类型
  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.js') contentType = 'text/javascript';
  if (ext === '.css') contentType = 'text/css';
  if (ext === '.json') contentType = 'application/json';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.jpg') contentType = 'image/jpg';

  res.setHeader('Content-Type', contentType);
  
  // 读取并返回文件
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

server.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log('📁 项目文件结构:');
  console.log('   - 前端页面: http://localhost:3000/');
  console.log('   - API接口: http://localhost:3000/api/recognize');
  console.log('💡 按 Ctrl+C 停止服务器');
});
