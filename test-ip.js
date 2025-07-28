// 测试IP解析功能
import { initIPDatabase, getIPLocation } from './lib/ipLocation.js';

async function testIP() {
  console.log('🧪 测试IP解析功能...');
  
  // 初始化
  await initIPDatabase();
  
  // 测试不同类型的IP
  const testIPs = [
    '50.7.253.114',
    '127.0.0.1',
    '192.168.1.1',
    '10.0.0.1',
    '8.8.8.8',
    '114.114.114.114',
    '1.2.3.4'
  ];
  
  for (const ip of testIPs) {
    const location = getIPLocation(ip);
    console.log(`IP: ${ip} => ${JSON.stringify(location)}`);
  }
  
  console.log('✅ IP解析测试完成');
}

testIP().catch(console.error);
