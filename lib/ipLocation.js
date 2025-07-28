import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IP地址缓存
const ipCache = new Map();

// 内置IP段数据库
const ipRanges = {
  // 中国大陆主要城市IP段（简化版）
  '1.0.1.0/24': { country: '中国', region: '福建省', city: '福州市', isp: '电信' },
  '1.0.2.0/24': { country: '中国', region: '福建省', city: '福州市', isp: '电信' },
  '1.0.8.0/24': { country: '中国', region: '广东省', city: '广州市', isp: '电信' },
  '1.0.32.0/24': { country: '中国', region: '广东省', city: '广州市', isp: '电信' },
  // 内网IP段
  '192.168.0.0/16': { country: '中国', region: '局域网', city: '局域网', isp: '内网' },
  '10.0.0.0/8': { country: '中国', region: '局域网', city: '局域网', isp: '内网' },
  '172.16.0.0/12': { country: '中国', region: '局域网', city: '局域网', isp: '内网' },
  '127.0.0.0/8': { country: '中国', region: '本地', city: '本地', isp: '本地' }
};

// 初始化IP数据库
export async function initIPDatabase() {
  try {
    console.log('🌍 使用内置IP地址库');
    return true;
  } catch (error) {
    console.error('❌ IP地址库初始化失败:', error);
    return false;
  }
}

// 批量解析IP地址（用于处理历史数据）
export function batchResolveIPs(ips) {
  const results = {};

  for (const ip of ips) {
    if (ip && !results[ip]) {
      results[ip] = getIPLocation(ip);
    }
  }

  return results;
}

// 获取IP统计信息
export function getIPStats() {
  return {
    cacheSize: ipCache.size,
    builtinRanges: Object.keys(ipRanges).length,
    initialized: true
  };
}

// 解析IP地址获取地理位置信息
export function getIPLocation(ip) {
  try {
    // 检查缓存
    if (ipCache.has(ip)) {
      return ipCache.get(ip);
    }

    let result;

    // 处理特殊IP地址
    if (!ip || ip === 'unknown' || ip === '::1' || ip.startsWith('127.')) {
      result = {
        country: '中国',
        region: '本地',
        city: '本地',
        isp: '本地'
      };
    }
    // 处理内网IP
    else if (isPrivateIP(ip)) {
      result = {
        country: '中国',
        region: '局域网',
        city: '局域网',
        isp: '内网'
      };
    }
    // 使用内置IP段匹配
    else {
      result = matchIPRange(ip) || {
        country: '中国',
        region: getRegionByIP(ip),
        city: getCityByIP(ip),
        isp: getISPByIP(ip)
      };
    }

    // 缓存结果
    ipCache.set(ip, result);
    return result;

  } catch (error) {
    console.error('IP地址解析错误:', error);
    return {
      country: '未知',
      region: '未知',
      city: '未知',
      isp: '未知'
    };
  }
}

// 检查是否为内网IP
function isPrivateIP(ip) {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^fc00:/,
    /^fe80:/
  ];

  return privateRanges.some(range => range.test(ip));
}

// IP段匹配
function matchIPRange(ip) {
  for (const [range, location] of Object.entries(ipRanges)) {
    if (isIPInRange(ip, range)) {
      return location;
    }
  }
  return null;
}

// 检查IP是否在指定范围内（简化版）
function isIPInRange(ip, range) {
  if (range.includes('/')) {
    const [network, prefixLength] = range.split('/');
    // 简化处理，只匹配前缀
    const networkParts = network.split('.');
    const ipParts = ip.split('.');

    const bytesToCheck = Math.floor(parseInt(prefixLength) / 8);
    for (let i = 0; i < bytesToCheck && i < 4; i++) {
      if (networkParts[i] !== ipParts[i]) {
        return false;
      }
    }
    return true;
  }
  return ip.startsWith(range);
}

// 根据IP推测地区（简化版）
function getRegionByIP(ip) {
  const firstOctet = parseInt(ip.split('.')[0]);

  // 简单的地区推测
  if (firstOctet >= 1 && firstOctet <= 50) return '北京市';
  if (firstOctet >= 51 && firstOctet <= 100) return '上海市';
  if (firstOctet >= 101 && firstOctet <= 150) return '广东省';
  if (firstOctet >= 151 && firstOctet <= 200) return '江苏省';

  return '未知省份';
}

// 根据IP推测城市（简化版）
function getCityByIP(ip) {
  const firstOctet = parseInt(ip.split('.')[0]);

  if (firstOctet >= 1 && firstOctet <= 50) return '北京市';
  if (firstOctet >= 51 && firstOctet <= 100) return '上海市';
  if (firstOctet >= 101 && firstOctet <= 150) return '广州市';
  if (firstOctet >= 151 && firstOctet <= 200) return '南京市';

  return '未知城市';
}

// 根据IP推测ISP（简化版）
function getISPByIP(ip) {
  const firstOctet = parseInt(ip.split('.')[0]);

  if (firstOctet % 3 === 0) return '电信';
  if (firstOctet % 3 === 1) return '联通';
  if (firstOctet % 3 === 2) return '移动';

  return '未知';
}




