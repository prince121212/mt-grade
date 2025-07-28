-- 美团评分计算工具数据库表结构
-- 支持多次执行，不会产生重复错误

-- 1. 创建或修复访问记录表
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  beijing_time TIMESTAMP,
  user_ip VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(100),
  country VARCHAR(50),
  region VARCHAR(100),
  city VARCHAR(100),
  -- IP解析字段（新增）
  ip_country VARCHAR(50),
  ip_region VARCHAR(100),
  ip_city VARCHAR(100),
  ip_isp VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  is_mobile BOOLEAN DEFAULT FALSE,
  referer TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  page_load_time DECIMAL(6,3),
  time_on_page INTEGER,
  actions JSONB,
  exit_type VARCHAR(20),
  screen_resolution VARCHAR(20),
  viewport_size VARCHAR(20),
  language VARCHAR(10),
  timezone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 添加缺失字段（如果表已存在但缺少字段）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='language') THEN
    ALTER TABLE access_logs ADD COLUMN language VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='timezone') THEN
    ALTER TABLE access_logs ADD COLUMN timezone VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='screen_resolution') THEN
    ALTER TABLE access_logs ADD COLUMN screen_resolution VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='viewport_size') THEN
    ALTER TABLE access_logs ADD COLUMN viewport_size VARCHAR(20);
  END IF;
  -- 添加IP解析字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='ip_country') THEN
    ALTER TABLE access_logs ADD COLUMN ip_country VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='ip_region') THEN
    ALTER TABLE access_logs ADD COLUMN ip_region VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='ip_city') THEN
    ALTER TABLE access_logs ADD COLUMN ip_city VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='ip_isp') THEN
    ALTER TABLE access_logs ADD COLUMN ip_isp VARCHAR(100);
  END IF;
END $$;

-- 2. 创建响应记录表
CREATE TABLE IF NOT EXISTS response_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id VARCHAR(100) UNIQUE,
  access_log_id UUID REFERENCES access_logs(id),
  endpoint VARCHAR(100),
  method VARCHAR(10),
  request_size INTEGER,
  image_info JSONB,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  processing_time DECIMAL(8,3),
  siliconflow_request_time DECIMAL(8,3),
  internal_processing_time DECIMAL(8,3),
  status VARCHAR(20),
  status_code INTEGER,
  recognition_result JSONB,
  calculated_scores JSONB,
  confidence_score DECIMAL(4,3),
  image_quality VARCHAR(20),
  error_type VARCHAR(50),
  error_message TEXT,
  error_code VARCHAR(20),
  retry_count INTEGER DEFAULT 0,
  user_impact VARCHAR(20),
  business_impact VARCHAR(20),
  beijing_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 创建索引和安全策略
CREATE INDEX IF NOT EXISTS idx_access_logs_beijing_time ON access_logs(beijing_time);
CREATE INDEX IF NOT EXISTS idx_response_logs_beijing_time ON response_logs(beijing_time);

-- 4. 启用安全策略
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_logs ENABLE ROW LEVEL SECURITY;

-- 5. 创建访问策略（支持多次执行）
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow service role access" ON access_logs;
  DROP POLICY IF EXISTS "Allow service role access" ON response_logs;

  CREATE POLICY "Allow service role access" ON access_logs
    FOR ALL USING (auth.role() = 'service_role');

  CREATE POLICY "Allow service role access" ON response_logs
    FOR ALL USING (auth.role() = 'service_role');
END $$;

-- 完成
SELECT 'Database schema setup completed!' as status;
