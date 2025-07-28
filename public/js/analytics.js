// 前端数据收集脚本
class FrontendAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.pageLoadTime = performance.now();
    this.actions = [];
    this.startTime = Date.now();
    
    this.init();
  }
  
  init() {
    // 记录页面加载完成
    window.addEventListener('load', () => {
      this.recordAction('page_loaded', {
        load_time: (performance.now() / 1000).toFixed(3)
      });
    });
    
    // 记录页面离开
    window.addEventListener('beforeunload', () => {
      this.sendPageData();
    });
    
    // 记录页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordAction('page_hidden');
      } else {
        this.recordAction('page_visible');
      }
    });
    
    // 定期发送数据（每30秒）
    setInterval(() => {
      this.sendPageData();
    }, 30000);
  }
  
  // 记录用户行为
  recordAction(action, data = {}) {
    this.actions.push({
      action,
      timestamp: new Date().toISOString(),
      data
    });
  }
  
  // 记录文件上传
  recordFileUpload(fileInfo) {
    this.recordAction('file_upload', {
      file_size: fileInfo.size,
      file_type: fileInfo.type,
      file_name: fileInfo.name
    });
  }
  
  // 记录API调用开始
  recordApiStart() {
    this.recordAction('api_request_start');
  }
  
  // 记录API调用结束
  recordApiEnd(success, duration, error = null) {
    this.recordAction('api_request_end', {
      success,
      duration,
      error
    });
  }
  
  // 记录按钮点击
  recordButtonClick(buttonId) {
    this.recordAction('button_click', {
      button_id: buttonId
    });
  }
  
  // 记录错误
  recordError(error, context = '') {
    this.recordAction('error', {
      error_message: error.message || error,
      error_context: context,
      stack: error.stack
    });
  }
  
  // 发送页面数据到后端
  async sendPageData() {
    try {
      const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
      const pageLoadTime = (this.pageLoadTime / 1000).toFixed(3);
      
      const data = {
        session_id: this.sessionId,
        time_on_page: timeOnPage,
        page_load_time: parseFloat(pageLoadTime),
        actions: this.actions,
        exit_type: this.determineExitType(),
        url: window.location.href,
        referrer: document.referrer,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        user_agent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      // 使用sendBeacon确保数据能够发送
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', JSON.stringify(data));
      } else {
        // 降级到fetch
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          keepalive: true
        }).catch(console.error);
      }
      
      // 清空已发送的行为记录
      this.actions = [];
    } catch (error) {
      console.error('发送分析数据失败:', error);
    }
  }
  
  // 生成会话ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // 判断退出类型
  determineExitType() {
    const timeOnPage = (Date.now() - this.startTime) / 1000;
    
    // 如果停留时间少于5秒，认为是跳出
    if (timeOnPage < 5) {
      return 'bounce';
    }
    
    // 检查是否有错误行为
    const hasErrors = this.actions.some(action => action.action === 'error');
    if (hasErrors) {
      return 'error';
    }
    
    return 'normal';
  }
  
  // 获取页面性能数据
  getPerformanceData() {
    if (!window.performance) return {};
    
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return {};
    
    return {
      dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp_connect: navigation.connectEnd - navigation.connectStart,
      request_time: navigation.responseStart - navigation.requestStart,
      response_time: navigation.responseEnd - navigation.responseStart,
      dom_load: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      page_load: navigation.loadEventEnd - navigation.navigationStart
    };
  }
}

// 全局分析实例
window.analytics = new FrontendAnalytics();

// 全局错误捕获
window.addEventListener('error', (event) => {
  window.analytics.recordError(event.error, 'global_error');
});

window.addEventListener('unhandledrejection', (event) => {
  window.analytics.recordError(event.reason, 'unhandled_promise_rejection');
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontendAnalytics;
}
