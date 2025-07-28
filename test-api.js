// 简单的API测试脚本
const handler = require('./api/recognize.js').default;

// 模拟请求和响应对象
const mockReq = {
  method: 'POST',
  body: {
    imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
};

const mockRes = {
  setHeader: (key, value) => console.log(`Header: ${key} = ${value}`),
  status: (code) => ({
    json: (data) => console.log(`Status: ${code}, Response:`, data),
    end: () => console.log(`Status: ${code}, End`)
  }),
  json: (data) => console.log('Response:', data)
};

// 设置环境变量
process.env.SILICONFLOW_API_KEY = 'sk-nfiifjyogvxqdysiochdlyygpgqeyrnssqfisdpsolkgwkxx';
process.env.SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
process.env.USE_MODEL = 'Qwen/Qwen2.5-VL-32B-Instruct';

console.log('Testing API...');
handler(mockReq, mockRes).catch(console.error);
