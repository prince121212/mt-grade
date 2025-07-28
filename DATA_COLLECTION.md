# 数据收集系统说明

## 📊 概述

本系统集成了完整的用户行为和API响应数据收集功能，所有时间均记录为**北京时间**，帮助你深入了解用户使用情况和系统性能。

## 🗄️ 数据库表结构

### 1. 访问记录表 (access_logs)
记录用户访问和行为数据：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `beijing_time` | TIMESTAMP | 北京时间 |
| `user_ip` | VARCHAR(45) | 用户IP地址 |
| `user_agent` | TEXT | 浏览器信息 |
| `session_id` | VARCHAR(100) | 会话ID |
| `device_type` | VARCHAR(20) | 设备类型 (desktop/mobile/tablet) |
| `browser` | VARCHAR(50) | 浏览器名称 |
| `os` | VARCHAR(50) | 操作系统 |
| `page_load_time` | DECIMAL(6,3) | 页面加载时间(秒) |
| `time_on_page` | INTEGER | 页面停留时间(秒) |
| `actions` | JSONB | 用户操作记录 |
| `exit_type` | VARCHAR(20) | 退出类型 (normal/bounce/error) |

### 2. 响应记录表 (response_logs)
记录API调用和响应数据：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `request_id` | VARCHAR(100) | 请求ID |
| `beijing_time` | TIMESTAMP | 北京时间 |
| `processing_time` | DECIMAL(8,3) | 总处理时间(秒) |
| `siliconflow_request_time` | DECIMAL(8,3) | 外部API耗时 |
| `status` | VARCHAR(20) | 响应状态 (success/error/timeout) |
| `recognition_result` | JSONB | 星级识别结果 |
| `calculated_scores` | JSONB | 计算的评分结果 |
| `image_info` | JSONB | 图片信息 |
| `error_type` | VARCHAR(50) | 错误类型 |
| `user_impact` | VARCHAR(20) | 用户影响程度 |

## 📈 收集的数据类型

### 访问记录收集
- ✅ **基础访问信息**：IP、时间、设备类型、浏览器
- ✅ **用户行为**：页面停留时间、操作序列、退出方式
- ✅ **性能数据**：页面加载时间、交互响应时间
- ✅ **会话跟踪**：基于IP和User-Agent的会话识别

### 响应记录收集
- ✅ **API性能**：处理时间、外部API耗时、内部处理时间
- ✅ **识别结果**：星级统计、评分计算、置信度评估
- ✅ **错误监控**：错误类型、错误消息、重试次数
- ✅ **业务影响**：用户影响程度、业务影响评估

## 🔧 使用方法

### 1. 设置数据库
在Supabase SQL编辑器中执行：
```sql
-- 执行 database/schema.sql 中的所有SQL语句
```

### 2. 配置环境变量
在Vercel中添加Supabase配置：
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 前端数据收集
前端自动收集以下数据：
```javascript
// 页面访问
window.analytics.recordAction('page_view');

// 文件上传
window.analytics.recordFileUpload(fileInfo);

// 按钮点击
window.analytics.recordButtonClick('recognize_btn');

// API调用
window.analytics.recordApiStart();
window.analytics.recordApiEnd(success, duration, error);

// 错误记录
window.analytics.recordError(error, context);
```

### 4. 后端数据收集
API自动记录：
```javascript
// 访问日志
const accessLog = await DataCollector.logAccess(req, additionalData);

// 响应日志
await DataCollector.logResponse(requestId, accessLogId, responseData);

// 更新访问记录
await DataCollector.updateAccessLog(accessLogId, updateData);
```

## 📊 数据分析视图

系统提供了预定义的分析视图：

### 每日统计 (daily_stats)
```sql
SELECT * FROM daily_stats ORDER BY date DESC LIMIT 30;
```
显示：访问量、独立访客、会话数、平均加载时间等

### API性能 (api_performance)
```sql
SELECT * FROM api_performance ORDER BY date DESC LIMIT 30;
```
显示：请求总数、成功率、平均处理时间等

## 🔍 常用查询示例

### 1. 查看今日访问统计
```sql
SELECT 
  COUNT(*) as total_visits,
  COUNT(DISTINCT user_ip) as unique_visitors,
  AVG(page_load_time) as avg_load_time,
  AVG(time_on_page) as avg_time_on_page
FROM access_logs 
WHERE DATE(beijing_time) = CURRENT_DATE;
```

### 2. 查看API成功率
```sql
SELECT 
  DATE(beijing_time) as date,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  ROUND(COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM response_logs 
WHERE beijing_time >= NOW() - INTERVAL '7 days'
GROUP BY DATE(beijing_time)
ORDER BY date DESC;
```

### 3. 查看设备类型分布
```sql
SELECT 
  device_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM access_logs 
WHERE DATE(beijing_time) = CURRENT_DATE
GROUP BY device_type;
```

### 4. 查看错误类型统计
```sql
SELECT 
  error_type,
  COUNT(*) as error_count,
  AVG(processing_time) as avg_processing_time
FROM response_logs 
WHERE status = 'error' 
  AND beijing_time >= NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY error_count DESC;
```

## 🚨 监控建议

### 关键指标监控
1. **API成功率** < 95% 需要关注
2. **平均响应时间** > 10秒 需要优化
3. **跳出率** > 80% 需要改进用户体验
4. **错误率** > 5% 需要排查问题

### 定期检查
- 每日检查访问量和成功率
- 每周分析用户行为趋势
- 每月评估系统性能指标
- 及时处理异常错误

## 🔒 隐私和安全

- ✅ 不收集个人敏感信息
- ✅ IP地址仅用于统计分析
- ✅ 所有数据存储在Supabase安全环境
- ✅ 支持数据删除和清理策略

## 📝 注意事项

1. **时区统一**：所有时间均为北京时间
2. **数据清理**：建议定期清理超过6个月的历史数据
3. **性能影响**：数据收集对用户体验影响极小
4. **扩展性**：可根据需要添加更多收集字段

现在你的美团评分计算工具已经具备了完整的数据收集和分析能力！🎯
