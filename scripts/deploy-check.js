#!/usr/bin/env node

// 部署前检查脚本
const fs = require('fs');
const path = require('path');

console.log('🔍 开始部署前检查...\n');

let hasErrors = false;

// 检查必要文件
const requiredFiles = [
  'api/recognize.js',
  'api/analytics.js',
  'lib/supabase.js',
  'lib/dataCollector.js',
  'public/index.html',
  'public/js/analytics.js',
  'database/schema.sql',
  'package.json',
  'vercel.json',
  '.env.example'
];

console.log('📁 检查必要文件...');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    hasErrors = true;
  }
});

// 检查环境变量配置
console.log('\n🔧 检查环境变量配置...');
const envExample = path.join(__dirname, '..', '.env.example');
if (fs.existsSync(envExample)) {
  const envContent = fs.readFileSync(envExample, 'utf8');
  const requiredEnvVars = [
    'SILICONFLOW_API_KEY',
    'SILICONFLOW_API_URL',
    'USE_MODEL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`❌ ${envVar} - 环境变量未配置`);
      hasErrors = true;
    }
  });
}

// 检查API路由
console.log('\n🔌 检查API路由...');
const apiFiles = ['api/recognize.js', 'api/analytics.js'];
apiFiles.forEach(apiFile => {
  const filePath = path.join(__dirname, '..', apiFile);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否有export default
    if (content.includes('export default')) {
      console.log(`✅ ${apiFile} - 导出正常`);
    } else {
      console.log(`❌ ${apiFile} - 缺少默认导出`);
      hasErrors = true;
    }
    
    // 检查是否引入了数据收集
    if (content.includes('DataCollector')) {
      console.log(`✅ ${apiFile} - 数据收集已集成`);
    } else {
      console.log(`⚠️  ${apiFile} - 未集成数据收集`);
    }
  }
});

// 检查前端集成
console.log('\n🌐 检查前端集成...');
const indexPath = path.join(__dirname, '..', 'public/index.html');
if (fs.existsSync(indexPath)) {
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  if (htmlContent.includes('analytics.js')) {
    console.log('✅ 前端分析脚本已引入');
  } else {
    console.log('❌ 前端分析脚本未引入');
    hasErrors = true;
  }
  
  if (htmlContent.includes('window.analytics')) {
    console.log('✅ 前端数据收集已集成');
  } else {
    console.log('❌ 前端数据收集未集成');
    hasErrors = true;
  }
}

// 检查数据库表结构
console.log('\n🗄️  检查数据库表结构...');
const schemaPath = path.join(__dirname, '..', 'database/schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const requiredTables = ['access_logs', 'response_logs'];
  requiredTables.forEach(table => {
    if (schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.log(`✅ ${table} 表结构已定义`);
    } else {
      console.log(`❌ ${table} 表结构未定义`);
      hasErrors = true;
    }
  });
  
  if (schemaContent.includes('beijing_time')) {
    console.log('✅ 北京时间字段已配置');
  } else {
    console.log('❌ 北京时间字段未配置');
    hasErrors = true;
  }
}

// 检查Vercel配置
console.log('\n⚡ 检查Vercel配置...');
const vercelPath = path.join(__dirname, '..', 'vercel.json');
if (fs.existsSync(vercelPath)) {
  const vercelContent = fs.readFileSync(vercelPath, 'utf8');
  const config = JSON.parse(vercelContent);
  
  if (config.functions && config.functions['api/recognize.js']) {
    console.log('✅ API函数配置正常');
  } else {
    console.log('❌ API函数配置缺失');
    hasErrors = true;
  }
  
  if (config.rewrites) {
    console.log('✅ 路由重写配置正常');
  } else {
    console.log('⚠️  路由重写配置缺失');
  }
}

// 总结
console.log('\n📊 检查总结:');
if (hasErrors) {
  console.log('❌ 发现问题，请修复后再部署');
  process.exit(1);
} else {
  console.log('✅ 所有检查通过，可以部署！');
  
  console.log('\n🚀 部署步骤提醒:');
  console.log('1. 在Supabase中执行 database/schema.sql');
  console.log('2. 在Vercel中配置环境变量');
  console.log('3. 推送代码到GitHub');
  console.log('4. 在Vercel中重新部署');
  console.log('5. 测试所有功能');
}

console.log('\n🎯 完成检查！');
