# Vercel部署指南

## 快速部署步骤

### 1. 准备工作

确保你有以下信息：
- SiliconFlow API密钥
- GitHub账号
- Vercel账号

### 2. 上传代码到GitHub

```bash
# 初始化git仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: 美团评分计算工具"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/yourusername/mt-grade.git

# 推送到GitHub
git push -u origin main
```

### 3. 在Vercel中部署

1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 选择你的GitHub仓库
5. 点击 "Deploy"

### 4. 配置环境变量

在Vercel项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|----|----|
| `SILICONFLOW_API_KEY` | `sk-nfiifjyogvxqdysiochdlyygpgqeyrnssqfisdpsolkgwkxx` | 你的API密钥 |
| `SILICONFLOW_API_URL` | `https://api.siliconflow.cn/v1/chat/completions` | API地址 |
| `USE_MODEL` | `Qwen/Qwen2.5-VL-32B-Instruct` | 使用的模型 |

**设置步骤：**
1. 在Vercel项目页面，点击 "Settings"
2. 选择 "Environment Variables"
3. 添加上述三个环境变量
4. 点击 "Save"

### 5. 重新部署

添加环境变量后，需要重新部署：
1. 在Vercel项目页面，点击 "Deployments"
2. 点击最新部署右侧的三个点
3. 选择 "Redeploy"

## 项目结构说明

```
mt-grade/
├── api/
│   └── recognize.js          # 后端API，处理图片识别
├── public/
│   └── index.html           # 前端页面
├── package.json             # 项目配置
├── vercel.json             # Vercel部署配置
├── .env.example            # 环境变量示例
├── .gitignore              # Git忽略文件
└── DEPLOYMENT.md           # 部署说明
```

## 安全特性

✅ **API密钥隐藏**：存储在环境变量中，用户无法看到  
✅ **服务端处理**：图片识别在服务端进行，逻辑不暴露  
✅ **HTTPS加密**：Vercel自动提供SSL证书  
✅ **CORS控制**：API只接受来自同域的请求  

## 测试部署

部署完成后，访问你的Vercel域名，测试以下功能：

1. 上传图片功能是否正常
2. 图片识别是否工作
3. 评分计算是否正确
4. 错误处理是否友好

## 常见问题

### Q: API调用失败怎么办？
A: 检查环境变量是否正确设置，特别是API密钥

### Q: 图片上传后没有反应？
A: 检查浏览器控制台是否有错误信息，可能是网络问题

### Q: 如何查看服务端日志？
A: 在Vercel项目页面的"Functions"标签中可以查看API日志

### Q: 如何更新代码？
A: 推送新代码到GitHub，Vercel会自动重新部署

## 监控和维护

- 定期检查API使用量
- 监控错误日志
- 及时更新依赖包
- 考虑添加访问频率限制

## 成本控制

- Vercel免费版有使用限制
- 监控API调用次数
- 考虑添加缓存机制
- 优化图片大小以减少处理时间
