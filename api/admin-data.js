import { supabaseAdmin } from '../lib/supabase.js';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 获取统计数据
    const statistics = await getStatistics();
    
    // 获取访问记录（最近1000条，用于前端筛选和分页）
    const accessLogs = await getAccessLogs();

    // 获取响应记录（最近1000条，用于前端筛选和分页）
    const responseLogs = await getResponseLogs();

    res.status(200).json({
      success: true,
      statistics,
      accessLogs,
      responseLogs
    });

  } catch (error) {
    console.error('管理员数据获取错误:', error);
    res.status(500).json({
      success: false,
      error: '数据获取失败'
    });
  }
}

// 获取统计数据
async function getStatistics() {
  try {
    // 总访问量
    const { count: totalVisits } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true });

    // 成功识别次数
    const { count: successCount } = await supabaseAdmin
      .from('response_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success');

    // 失败次数
    const { count: errorCount } = await supabaseAdmin
      .from('response_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error');

    // 平均响应时间
    const { data: avgData } = await supabaseAdmin
      .from('response_logs')
      .select('processing_time')
      .not('processing_time', 'is', null);

    let avgResponseTime = 0;
    if (avgData && avgData.length > 0) {
      const total = avgData.reduce((sum, item) => sum + (item.processing_time || 0), 0);
      avgResponseTime = (total / avgData.length).toFixed(2);
    }

    return {
      totalVisits: totalVisits || 0,
      successCount: successCount || 0,
      errorCount: errorCount || 0,
      avgResponseTime: parseFloat(avgResponseTime)
    };

  } catch (error) {
    console.error('统计数据获取错误:', error);
    return {
      totalVisits: 0,
      successCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    };
  }
}

// 获取访问记录
async function getAccessLogs() {
  try {
    const { data, error } = await supabaseAdmin
      .from('access_logs')
      .select(`
        id,
        beijing_time,
        user_ip,
        user_agent,
        session_id,
        country,
        region,
        city,
        ip_country,
        ip_region,
        ip_city,
        ip_isp,
        device_type,
        browser,
        os,
        is_mobile,
        referer,
        utm_source,
        utm_medium,
        page_load_time,
        time_on_page,
        actions,
        exit_type,
        screen_resolution,
        viewport_size,
        language,
        timezone,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('访问记录获取错误:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('访问记录获取异常:', error);
    return [];
  }
}

// 获取响应记录
async function getResponseLogs() {
  try {
    const { data, error } = await supabaseAdmin
      .from('response_logs')
      .select(`
        id,
        request_id,
        access_log_id,
        endpoint,
        method,
        request_size,
        image_info,
        start_time,
        end_time,
        processing_time,
        siliconflow_request_time,
        internal_processing_time,
        status,
        status_code,
        recognition_result,
        calculated_scores,
        confidence_score,
        image_quality,
        error_type,
        error_message,
        error_code,
        retry_count,
        user_impact,
        business_impact,
        beijing_time,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('响应记录获取错误:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('响应记录获取异常:', error);
    return [];
  }
}
