# 美团评分计算工具

这是一个美团星级评价识别与评分计算工具，可以自动识别图片中的星级评价并计算美团评分。

## 项目简介

本项目是一个单页面Web应用，主要功能包括：
- 上传包含美团星级评价的图片
- 自动识别图片中的1-5星评价数量
- 计算当前美团评分
- 计算达到目标评分（4.7、4.8、4.9）所需的5星评价数量

## Vercel部署方案

为了保护API密钥和计算逻辑不被用户看到，提供以下几种部署方案：

### 方案一：前后端分离（推荐）

**优点：** 最安全，API密钥完全隐藏，计算逻辑在服务端
**缺点：** 需要重构代码

**实施步骤：**

1. **创建后端API**
   ```
   /api
   ├── recognize.js          # 图片识别API
   └── calculate.js          # 评分计算API
   ```

2. **前端代码修改**
   - 移除所有API密钥和敏感配置
   - 将API调用改为调用Vercel的API路由
   - 保留UI交互逻辑

3. **环境变量配置**
   在Vercel项目设置中添加环境变量：
   ```
   SILICONFLOW_API_KEY=你的API密钥
   SILICONFLOW_API_URL=https://api.siliconflow.cn/v1/chat/completions
   USE_MODEL=Qwen/Qwen2.5-VL-32B-Instruct
   ```

4. **项目结构**
   ```
   /
   ├── api/
   │   ├── recognize.js      # 后端API
   │   └── calculate.js      # 计算API
   ├── public/
   │   └── index.html        # 前端页面
   ├── package.json
   └── vercel.json
   ```

### 方案二：代码混淆 + 环境变量

**优点：** 实施简单，保持单页面结构
**缺点：** 安全性相对较低，有被逆向的风险

**实施步骤：**

1. **使用环境变量**
   - 将API密钥移到环境变量中
   - 在构建时注入到代码中

2. **代码混淆**
   - 使用JavaScript混淆工具
   - 压缩和混淆计算逻辑

3. **Vercel配置**
   ```json
   {
     "build": {
       "env": {
         "SILICONFLOW_API_KEY": "@siliconflow-api-key"
       }
     }
   }
   ```

### 方案三：服务端渲染 + 加密

**优点：** 代码在服务端执行，用户看不到源码
**缺点：** 需要改为SSR架构

**实施步骤：**

1. **使用Next.js**
   - 将HTML转换为Next.js页面
   - 使用服务端组件处理敏感逻辑

2. **API路由**
   - 创建API路由处理图片识别
   - 在服务端进行所有计算

## ✅ 已完成实施

**已采用方案一（前后端分离）**，项目已重构完成：

### ✅ 1. 项目结构已创建

```
mt-grade/
├── api/
│   └── recognize.js          # ✅ 后端API已完成
├── public/
│   └── index.html           # ✅ 前端页面已重构
├── package.json             # ✅ 项目配置已创建
├── vercel.json             # ✅ 部署配置已创建
├── .env.example            # ✅ 环境变量示例
├── .gitignore              # ✅ Git配置
├── DEPLOYMENT.md           # ✅ 部署指南
└── CHECKLIST.md            # ✅ 检查清单
```

### ✅ 2. 后端API已实现

`api/recognize.js` 已完成，主要功能：
- ✅ 接收前端图片数据
- ✅ 调用SiliconFlow API进行图片识别
- ✅ 处理API响应和错误
- ✅ 返回标准化的JSON结果
- ✅ 完整的CORS支持
- ✅ 环境变量安全配置

### ✅ 3. 前端代码已重构

`public/index.html` 已完成重构：
- ✅ 移除了所有API密钥和敏感信息
- ✅ API调用改为本地路由：`fetch('/api/recognize', { ... })`
- ✅ 保留了完整的UI交互逻辑
- ✅ 保持了原有的设计和用户体验
- ✅ 添加了完善的错误处理

### ✅ 4. 环境变量配置已准备

需要在Vercel中配置的环境变量：
- `SILICONFLOW_API_KEY` = `sk-nfiifjyogvxqdysiochdlyygpgqeyrnssqfisdpsolkgwkxx`
- `SILICONFLOW_API_URL` = `https://api.siliconflow.cn/v1/chat/completions`
- `USE_MODEL` = `Qwen/Qwen2.5-VL-32B-Instruct`

### ✅ 5. 部署配置已完成

`vercel.json` 已配置：
- ✅ API函数超时设置（30秒）
- ✅ 路由重写规则
- ✅ CORS头部配置

## 安全特性

1. **API密钥隐藏**：所有敏感信息存储在环境变量中
2. **服务端处理**：图片识别和计算在服务端进行
3. **代码保护**：用户无法查看API调用逻辑
4. **HTTPS加密**：Vercel自动提供HTTPS
5. **CORS控制**：可以限制API访问来源

## 部署步骤

1. 重构代码按照方案一的结构
2. 在Vercel中创建新项目
3. 连接GitHub仓库
4. 配置环境变量
5. 部署项目

## 注意事项

- 确保API密钥不要提交到代码仓库
- 定期更换API密钥
- 监控API使用量，防止滥用
- 考虑添加访问频率限制

---

**技术支持：** 茶百道陶溪川技术部