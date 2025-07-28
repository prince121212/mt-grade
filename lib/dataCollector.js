import { supabaseAdmin, getBeijingTime, generateSessionId, parseUserAgent } from './supabase.js';
import { getIPLocation } from './ipLocation.js';

// 数据收集服务类
export class DataCollector {
  
  // 记录访问日志
  static async logAccess(req, additionalData = {}) {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const userIP = this.getClientIP(req);
      const referer = req.headers.referer || req.headers.referrer || '';
      
      // 解析User-Agent
      const deviceInfo = parseUserAgent(userAgent);

      // 生成会话ID
      const sessionId = generateSessionId(userIP, userAgent);

      // 解析IP地址获取地理位置
      const ipLocation = getIPLocation(userIP);
      
      // 构建访问记录
      const accessLog = {
        beijing_time: getBeijingTime(),
        user_ip: userIP,
        user_agent: userAgent,
        session_id: sessionId,

        // 设备信息
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        is_mobile: deviceInfo.isMobile,

        // 访问来源
        referer: referer,
        utm_source: this.extractUTMParam(referer, 'utm_source'),
        utm_medium: this.extractUTMParam(referer, 'utm_medium'),

        // IP地理位置信息
        ip_country: ipLocation.country,
        ip_region: ipLocation.region,
        ip_city: ipLocation.city,
        ip_isp: ipLocation.isp,

        // 额外数据
        ...additionalData
      };
      
      // 插入数据库
      const { data, error } = await supabaseAdmin
        .from('access_logs')
        .insert([accessLog])
        .select()
        .single();
      
      if (error) {
        console.error('访问日志记录失败:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('访问日志记录异常:', error);
      return null;
    }
  }
  
  // 记录响应日志
  static async logResponse(requestId, accessLogId, responseData) {
    try {
      const responseLog = {
        request_id: requestId,
        access_log_id: accessLogId,
        beijing_time: getBeijingTime(),
        
        // 请求信息
        endpoint: responseData.endpoint || '/api/recognize',
        method: responseData.method || 'POST',
        request_size: responseData.requestSize || 0,
        
        // 图片信息
        image_info: responseData.imageInfo || {},
        
        // 处理时间
        start_time: responseData.startTime,
        end_time: responseData.endTime,
        processing_time: responseData.processingTime,
        siliconflow_request_time: responseData.apiTime,
        internal_processing_time: responseData.internalTime,
        
        // 响应状态
        status: responseData.status,
        status_code: responseData.statusCode,
        
        // 识别结果
        recognition_result: responseData.recognitionResult,
        calculated_scores: responseData.calculatedScores,
        confidence_score: responseData.confidenceScore,
        image_quality: responseData.imageQuality,
        
        // 错误信息
        error_type: responseData.errorType,
        error_message: responseData.errorMessage,
        error_code: responseData.errorCode,
        retry_count: responseData.retryCount || 0,
        
        // 业务影响评估
        user_impact: this.assessUserImpact(responseData.status, responseData.processingTime),
        business_impact: this.assessBusinessImpact(responseData.status, responseData.errorType)
      };
      
      // 插入数据库
      const { data, error } = await supabaseAdmin
        .from('response_logs')
        .insert([responseLog])
        .select()
        .single();
      
      if (error) {
        console.error('响应日志记录失败:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('响应日志记录异常:', error);
      return null;
    }
  }
  
  // 更新访问记录的页面停留时间和用户行为
  static async updateAccessLog(accessLogId, updateData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('access_logs')
        .update({
          time_on_page: updateData.timeOnPage,
          actions: updateData.actions,
          exit_type: updateData.exitType,
          page_load_time: updateData.pageLoadTime
        })
        .eq('id', accessLogId)
        .select()
        .single();
      
      if (error) {
        console.error('访问记录更新失败:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('访问记录更新异常:', error);
      return null;
    }
  }
  
  // 获取客户端真实IP
  static getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }
  
  // 提取UTM参数
  static extractUTMParam(url, param) {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get(param);
    } catch {
      return null;
    }
  }
  
  // 评估用户影响程度
  static assessUserImpact(status, processingTime) {
    if (status === 'error') return 'high';
    if (status === 'timeout') return 'high';
    if (processingTime > 10) return 'medium';
    if (processingTime > 5) return 'low';
    return 'low';
  }
  
  // 评估业务影响程度
  static assessBusinessImpact(status, errorType) {
    if (status === 'error') {
      if (errorType === 'api_timeout' || errorType === 'server_error') return 'high';
      if (errorType === 'invalid_image' || errorType === 'rate_limit') return 'medium';
      return 'low';
    }
    return 'low';
  }
  
  // 生成请求ID
  static generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
