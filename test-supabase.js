// 测试Supabase连接
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('🔧 环境变量检查:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 已设置' : '❌ 未设置');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已设置' : '❌ 未设置');

import { supabaseAdmin } from './lib/supabase.js';

async function testConnection() {
  try {
    console.log('🔍 测试Supabase连接...');
    
    // 测试连接 - 检查表是否存在
    const { data, error } = await supabaseAdmin
      .from('access_logs')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ 数据库表访问失败:', error);

      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('💡 表不存在，需要创建数据库表结构');
        console.log('📋 请在Supabase SQL编辑器中执行以下步骤:');
        console.log('1. 登录 https://supabase.com/dashboard');
        console.log('2. 选择你的项目');
        console.log('3. 点击左侧菜单的 "SQL Editor"');
        console.log('4. 复制 database/schema.sql 中的内容并执行');
      } else {
        console.log('💡 可能是权限问题或其他配置问题');
      }
    } else {
      console.log('✅ Supabase连接成功!');
      console.log('📊 表结构正常，数据条数:', data?.length || 0);
    }
  } catch (error) {
    console.error('❌ 连接测试异常:', error);
  }
}

testConnection();
