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

  try {
    const analyticsData = req.body;
    
    // 验证必要字段
    if (!analyticsData.session_id) {
      return res.status(400).json({ error: '缺少会话ID' });
    }

    // 查找或创建访问记录
    let accessLog = await findOrCreateAccessLog(req, analyticsData);
    
    if (accessLog) {
      // 更新访问记录
      await DataCollector.updateAccessLog(accessLog.id, {
        timeOnPage: analyticsData.time_on_page,
        actions: analyticsData.actions,
        exitType: analyticsData.exit_type,
        pageLoadTime: analyticsData.page_load_time
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('分析数据处理错误:', error);
    res.status(500).json({ 
      success: false,
      error: '数据处理失败' 
    });
  }
}

// 查找或创建访问记录
async function findOrCreateAccessLog(req, analyticsData) {
  try {
    const userIP = DataCollector.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    
    // 首先尝试查找现有记录（基于session_id和IP）
    const { supabaseAdmin } = await import('../lib/supabase.js');
    
    const { data: existingLog } = await supabaseAdmin
      .from('access_logs')
      .select('*')
      .eq('session_id', analyticsData.session_id)
      .eq('user_ip', userIP)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (existingLog) {
      return existingLog;
    }
    
    // 如果没有找到，创建新的访问记录
    const accessLog = await DataCollector.logAccess(req, {
      session_id: analyticsData.session_id,
      page_load_time: analyticsData.page_load_time,
      actions: analyticsData.actions || [],
      referer: analyticsData.referrer,
      // 从前端数据中提取额外信息
      screen_resolution: analyticsData.screen_resolution,
      viewport_size: analyticsData.viewport_size,
      language: analyticsData.language,
      timezone: analyticsData.timezone
    });
    
    return accessLog;
  } catch (error) {
    console.error('访问记录处理错误:', error);
    return null;
  }
}
