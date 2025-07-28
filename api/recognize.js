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

  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    // API配置从环境变量获取
    const SILICONFLOW_API_URL = process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
    const USE_MODEL = process.env.USE_MODEL || 'Qwen/Qwen2.5-VL-32B-Instruct';
    const API_KEY = process.env.SILICONFLOW_API_KEY;

    if (!API_KEY) {
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

    const result = await response.json();

    if (!response.ok) {
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

      // 返回成功结果
      res.status(200).json({
        success: true,
        data: starResult
      });

    } catch (parseError) {
      throw new Error(`结果解析失败: ${parseError.message}\n处理后的内容: ${rawContent}`);
    }

  } catch (error) {
    console.error('识别错误:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || '识别过程中发生错误，请重试' 
    });
  }
}
