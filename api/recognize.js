import { DataCollector } from '../lib/dataCollector.js';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 生成请求ID和记录开始时间
  const requestId = DataCollector.generateRequestId();
  const startTime = new Date().toISOString();
  let accessLogId = null;

  // 记录访问日志
  try {
    const accessLog = await DataCollector.logAccess(req, {
      page_load_time: null, // 前端会通过其他方式更新
      actions: [{ action: 'api_request', timestamp: startTime, endpoint: '/api/recognize' }]
    });
    accessLogId = accessLog?.id;
  } catch (error) {
    console.error('访问日志记录失败:', error);
  }

  try {
    const { imageData } = req.body;

    if (!imageData) {
      // 记录错误响应
      await DataCollector.logResponse(requestId, accessLogId, {
        startTime,
        endTime: new Date().toISOString(),
        processingTime: 0,
        status: 'error',
        statusCode: 400,
        errorType: 'missing_data',
        errorMessage: '缺少图片数据',
        errorCode: 'MISSING_IMAGE_DATA'
      });
      return res.status(400).json({ error: '缺少图片数据' });
    }

    // 解析图片信息
    const imageInfo = parseImageData(imageData);

    // API配置从环境变量获取
    const SILICONFLOW_API_URL = process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
    const USE_MODEL = process.env.USE_MODEL || 'Qwen/Qwen2.5-VL-32B-Instruct';
    const API_KEY = process.env.SILICONFLOW_API_KEY;

    if (!API_KEY) {
      // 记录配置错误
      await DataCollector.logResponse(requestId, accessLogId, {
        startTime,
        endTime: new Date().toISOString(),
        processingTime: 0,
        status: 'error',
        statusCode: 500,
        errorType: 'config_error',
        errorMessage: '服务配置错误：缺少API密钥',
        errorCode: 'MISSING_API_KEY',
        imageInfo
      });
      return res.status(500).json({ error: '服务配置错误：缺少API密钥' });
    }

    const prompt = `请识别图片中包含的星级评价数据，统计5星、4星、3星、2星和1星各有多少条评价。
如果图片中没有相关信息，请返回各星级数量为0。
请严格按照以下JSON格式返回结果，不要添加任何额外内容，不要添加任何代码标记（如\`\`\`等）：
{
  "5星": 0,
  "4星": 0,
  "3星": 0,
  "2星": 0,
  "1星": 0
}`;

    // 记录API调用开始时间
    const apiStartTime = Date.now();
    const response = await fetch(SILICONFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "model": USE_MODEL,
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": prompt
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": imageData
                }
              }
            ]
          }
        ],
        "temperature": 0.1,
        "max_tokens": 200
      })
    });

    // 记录API调用结束时间
    const apiEndTime = Date.now();
    const apiDuration = (apiEndTime - apiStartTime) / 1000;

    const result = await response.json();

    if (!response.ok) {
      // 记录API错误响应
      const endTime = new Date().toISOString();
      const totalTime = (Date.now() - new Date(startTime).getTime()) / 1000;

      await DataCollector.logResponse(requestId, accessLogId, {
        startTime,
        endTime,
        processingTime: totalTime,
        siliconflow_request_time: apiDuration,
        internal_processing_time: totalTime - apiDuration,
        status: 'error',
        statusCode: response.status,
        errorType: 'api_error',
        errorMessage: result.error?.message || `API请求失败 (状态码: ${response.status})`,
        errorCode: 'API_REQUEST_FAILED',
        imageInfo,
        requestSize: JSON.stringify(req.body).length
      });

      throw new Error(
        result.error?.message ||
        `API请求失败 (状态码: ${response.status})`
      );
    }

    if (!result.choices || result.choices.length === 0 || !result.choices[0].message?.content) {
      throw new Error('API返回格式不正确，无法解析结果');
    }

    let rawContent = result.choices[0].message.content;
    rawContent = rawContent.replace(/```json|```/g, '').trim();

    try {
      const starResult = JSON.parse(rawContent);
      const requiredKeys = ['5星', '4星', '3星', '2星', '1星'];
      const hasAllKeys = requiredKeys.every(key => starResult.hasOwnProperty(key));
      
      if (!hasAllKeys) {
        throw new Error('返回结果格式不正确，缺少必要的星级字段');
      }

      // 计算评分结果
      const calculatedScores = calculateMeituanScores(starResult);

      // 记录成功响应
      const endTime = new Date().toISOString();
      const totalTime = (Date.now() - new Date(startTime).getTime()) / 1000;

      await DataCollector.logResponse(requestId, accessLogId, {
        startTime,
        endTime,
        processingTime: totalTime,
        siliconflow_request_time: apiDuration,
        internal_processing_time: totalTime - apiDuration,
        status: 'success',
        statusCode: 200,
        recognitionResult: starResult,
        calculatedScores,
        confidenceScore: assessConfidence(starResult),
        imageQuality: assessImageQuality(imageInfo),
        imageInfo,
        requestSize: JSON.stringify(req.body).length
      });

      // 返回成功结果
      res.status(200).json({
        success: true,
        data: starResult,
        scores: calculatedScores
      });

    } catch (parseError) {
      throw new Error(`结果解析失败: ${parseError.message}\n处理后的内容: ${rawContent}`);
    }

  } catch (error) {
    console.error('识别错误:', error);

    // 记录异常响应
    const endTime = new Date().toISOString();
    const totalTime = (Date.now() - new Date(startTime).getTime()) / 1000;

    await DataCollector.logResponse(requestId, accessLogId, {
      startTime,
      endTime,
      processingTime: totalTime,
      status: 'error',
      statusCode: 500,
      errorType: 'processing_error',
      errorMessage: error.message || '识别过程中发生错误，请重试',
      errorCode: 'PROCESSING_ERROR'
    });

    res.status(500).json({
      success: false,
      error: error.message || '识别过程中发生错误，请重试'
    });
  }
}

// 辅助函数：解析图片数据信息
function parseImageData(imageData) {
  try {
    const [header, data] = imageData.split(',');
    const mimeMatch = header.match(/data:image\/(\w+);base64/);
    const format = mimeMatch ? mimeMatch[1] : 'unknown';

    // 计算文件大小（base64编码后的大小约为原文件的4/3）
    const sizeInBytes = Math.round((data.length * 3) / 4);

    return {
      format,
      file_size: sizeInBytes,
      dimensions: 'unknown', // 需要更复杂的解析才能获取尺寸
      has_exif: false // 简化处理
    };
  } catch (error) {
    return {
      format: 'unknown',
      file_size: 0,
      dimensions: 'unknown',
      has_exif: false
    };
  }
}

// 辅助函数：计算美团评分
function calculateMeituanScores(starData) {
  const star1 = starData['1星'] || 0;
  const star2 = starData['2星'] || 0;
  const star3 = starData['3星'] || 0;
  const star4 = starData['4星'] || 0;
  const star5 = starData['5星'] || 0;
  const total = star1 + star2 + star3 + star4 + star5;

  if (total === 0) {
    return {
      current_score: 0,
      total_reviews: 0,
      targets: {
        '4.7': { needed: 0, threshold: 4.65 },
        '4.8': { needed: 0, threshold: 4.75 },
        '4.9': { needed: 0, threshold: 4.85 }
      }
    };
  }

  const currentScore = (1*star1 + 2*star2 + 3*star3 + 4*star4 + 5*star5) / total;

  return {
    current_score: parseFloat(currentScore.toFixed(2)),
    total_reviews: total,
    targets: {
      '4.7': { needed: calculateNeededStars(currentScore, total, 4.65), threshold: 4.65 },
      '4.8': { needed: calculateNeededStars(currentScore, total, 4.75), threshold: 4.75 },
      '4.9': { needed: calculateNeededStars(currentScore, total, 4.85), threshold: 4.85 }
    }
  };
}

// 辅助函数：计算所需5星评价数
function calculateNeededStars(currentScore, currentTotal, targetThreshold) {
  const numerator = currentScore * currentTotal - targetThreshold * currentTotal;
  const denominator = targetThreshold - 5;

  if (denominator === 0) return 0;

  let x = numerator / denominator;
  x = Math.ceil(x);
  return x < 0 ? 0 : x;
}

// 辅助函数：评估识别置信度
function assessConfidence(starResult) {
  const total = Object.values(starResult).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  if (total < 10) return 0.6;
  if (total < 50) return 0.8;
  return 0.95;
}

// 辅助函数：评估图片质量
function assessImageQuality(imageInfo) {
  if (!imageInfo || imageInfo.file_size === 0) return 'poor';
  if (imageInfo.file_size < 100000) return 'poor'; // 小于100KB
  if (imageInfo.file_size < 500000) return 'fair'; // 小于500KB
  return 'good';
}
