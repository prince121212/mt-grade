// 测试数据收集功能
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });

import { DataCollector } from './lib/dataCollector.js';

async function testDataCollection() {
  console.log('🧪 测试数据收集功能...\n');

  // 模拟请求对象
  const mockReq = {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'x-forwarded-for': '192.168.1.100',
      'referer': 'https://google.com'
    },
    connection: {
      remoteAddress: '192.168.1.100'
    }
  };

  try {
    // 测试访问日志记录
    console.log('📊 测试访问日志记录...');
    const accessLog = await DataCollector.logAccess(mockReq, {
      page_load_time: 1.5,
      language: 'zh-CN',
      timezone: 'Asia/Shanghai'
    });

    if (accessLog) {
      console.log('✅ 访问日志记录成功!');
      console.log('📋 记录ID:', accessLog.id);
      console.log('🕐 北京时间:', accessLog.beijing_time);
      
      // 测试响应日志记录
      console.log('\n📈 测试响应日志记录...');
      const responseLog = await DataCollector.logResponse(
        'test_req_123',
        accessLog.id,
        {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          processingTime: 2.5,
          apiTime: 2.0,
          internalTime: 0.5,
          status: 'success',
          statusCode: 200,
          recognitionResult: { '5星': 10, '4星': 5, '3星': 2, '2星': 1, '1星': 0 },
          imageInfo: { format: 'jpeg', file_size: 1024000 }
        }
      );

      if (responseLog) {
        console.log('✅ 响应日志记录成功!');
        console.log('📋 记录ID:', responseLog.id);
        console.log('🕐 北京时间:', responseLog.beijing_time);
      } else {
        console.log('❌ 响应日志记录失败');
      }

    } else {
      console.log('❌ 访问日志记录失败');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }

  console.log('\n🎯 测试完成!');
}

testDataCollection();
