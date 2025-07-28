import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });

// 动态导入API处理函数
const { default: recognizeHandler } = await import('./api/recognize.js');
const { default: analyticsHandler } = await import('./api/analytics.js');
const { default: adminDataHandler } = await import('./api/admin-data.js');

// 导入IP地址库
const { initIPDatabase } = await import('./lib/ipLocation.js');

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

  // API路由处理
  if (pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        // 创建模拟的请求对象，包含headers
        const mockReq = {
          method: req.method,
          headers: req.headers,
          body: body ? JSON.parse(body) : {},
          url: req.url,
          connection: req.connection,
          socket: req.socket,
          ip: req.connection?.remoteAddress
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

        // 路由到对应的处理函数
        if (pathname === '/api/recognize') {
          await recognizeHandler(mockReq, mockRes);
        } else if (pathname === '/api/analytics') {
          await analyticsHandler(mockReq, mockRes);
        } else if (pathname === '/api/admin-data') {
          await adminDataHandler(mockReq, mockRes);
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'API endpoint not found' }));
        }
      } catch (error) {
        console.error('API处理错误:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // 静态文件服务
  let filePath;
  if (pathname === '/') {
    filePath = path.join(__dirname, 'public', 'index.html');
  } else if (pathname === '/admin') {
    filePath = path.join(__dirname, 'public', 'admin.html');
  } else {
    // 处理其他静态文件
    if (pathname.startsWith('/public/')) {
      filePath = pathname.substring(7); // 移除 /public 前缀
    } else {
      filePath = pathname;
    }
    filePath = path.join(__dirname, 'public', filePath);
  }

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

server.listen(PORT, async () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log('📁 项目文件结构:');
  console.log('   - 前端页面: http://localhost:3000/');
  console.log('   - 管理后台: http://localhost:3000/admin');
  console.log('   - API接口: http://localhost:3000/api/recognize');

  // 初始化IP地址库
  console.log('🌍 正在初始化IP地址库...');
  const ipInitSuccess = await initIPDatabase();
  if (ipInitSuccess) {
    console.log('✅ IP地址库初始化成功');
  } else {
    console.log('⚠️  IP地址库初始化失败，将使用备用方案');
  }

  console.log('💡 按 Ctrl+C 停止服务器');
});
