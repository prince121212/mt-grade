import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录并加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Supabase配置检查:');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('ANON_KEY:', supabaseKey ? '✅' : '❌');
console.log('SERVICE_KEY:', supabaseServiceKey ? '✅' : '❌');

// 创建客户端实例
export const supabase = createClient(supabaseUrl, supabaseKey);

// 创建服务端客户端（用于服务端操作）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 获取北京时间
export function getBeijingTime() {
  const now = new Date();
  // 转换为北京时间 (UTC+8)
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString();
}

// 生成会话ID（基于IP和User-Agent）
export function generateSessionId(ip, userAgent) {
  // 使用简单的哈希算法，避免crypto依赖
  const data = `${ip}-${userAgent}-${new Date().toDateString()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}

// 解析User-Agent
export function parseUserAgent(userAgent) {
  // 简单的User-Agent解析
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Tablet/.test(userAgent);
  
  let deviceType = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';
  
  // 提取浏览器信息
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return {
    deviceType,
    browser,
    os,
    isMobile,
    isTablet
  };
}
