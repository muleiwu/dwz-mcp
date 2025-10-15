# Mliev 短网址 MCP 客户端

基于 MCP（Model Context Protocol）协议的短网址管理客户端，为 AI 助手提供完整的短网址生成、管理和统计功能。

## ✨ 功能特性

- 🔗 **短网址创建**: 支持自定义域名、短代码、标题和描述
- 📋 **批量操作**: 一次性创建多个短网址，提高效率
- 🔍 **搜索筛选**: 支持域名筛选和关键词搜索
- 📊 **统计分析**: 获取详细的点击统计信息
- 🛡️ **错误处理**: 完善的错误处理和重试机制
- 🔒 **安全认证**: 基于 Bearer Token 的 API 认证

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# 远程短网址服务器配置
REMOTE_BASE_URL=https://api.example.com
REMOTE_API_KEY=your-api-key-here

# 其他可选配置
REQUEST_TIMEOUT=10000
MAX_RETRIES=3
LOG_LEVEL=info
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 📖 MCP 工具列表

### 1. create_short_url
创建新的短网址

**参数：**
- `original_url` (必填): 原始URL地址
- `domain` (必填): 短网址域名
- `title` (必填): 网页标题
- `custom_code` (可选): 自定义短代码
- `description` (可选): 描述信息
- `expire_at` (可选): 过期时间

**示例：**
```json
{
  "original_url": "https://www.example.com/products",
  "domain": "short.ly",
  "title": "产品页面",
  "description": "我们的产品展示页面",
  "custom_code": "products"
}
```

### 2. get_url_info
获取短网址详细信息

**参数：**
- `id` (必填): 短网址ID

**示例：**
```json
{
  "id": 123
}
```

### 3. list_short_urls
列出短网址，支持分页和搜索

**参数：**
- `page` (可选): 页码，默认1
- `page_size` (可选): 每页数量，默认10
- `domain` (可选): 域名筛选
- `keyword` (可选): 搜索关键词

**示例：**
```json
{
  "page": 1,
  "page_size": 20,
  "domain": "short.ly",
  "keyword": "产品"
}
```

### 4. delete_short_url
删除短网址

**参数：**
- `id` (必填): 短网址ID

**示例：**
```json
{
  "id": 123
}
```

### 5. batch_create_short_urls
批量创建短网址

**参数：**
- `urls` (必填): URL数组（最多50个）
- `domain` (必填): 短网址域名

**示例：**
```json
{
  "urls": [
    "https://www.example1.com",
    "https://www.example2.com"
  ],
  "domain": "short.ly"
}
```

### 6. list_domains
获取所有可用域名列表

**参数：** 无需参数

**示例：**
```json
{}
```

**返回信息：**
- 域名基本信息：ID、域名、协议
- 网站信息：网站名称、备案信息
- 配置信息：是否激活、参数透传设置
- 统计信息：总数、激活数量、未激活数量

## 🏗️ 项目结构

```
mliev-dwz-mcp/
├── src/
│   ├── index.js                 # 入口文件
│   ├── config/
│   │   └── remoteConfig.js      # 配置管理
│   ├── services/
│   │   ├── httpClient.js        # HTTP客户端
│   │   └── shortLinkService.js  # 短链接服务
│   ├── utils/
│   │   ├── validation.js        # 参数验证
│   │   └── errorHandler.js      # 错误处理
│   └── mcp/
│       ├── server.js            # MCP服务器
│       └── tools/               # MCP工具
│           ├── createShortUrl.js
│           ├── getUrlInfo.js
│           ├── listShortUrls.js
│           ├── deleteShortUrl.js
│           ├── batchCreateShortUrls.js
│           └── listDomains.js
├── tests/                       # 测试文件
├── package.json                 # 项目配置
├── .env.example                 # 环境变量模板
└── README.md                    # 项目说明
```

## 🔧 开发指南

### 可用脚本

```bash
# 启动开发服务器（热重载）
npm run dev

# 构建项目
npm run build

# 运行生产环境
npm start

# 运行测试
npm test

# 代码检查
npm run lint

# 自动修复代码格式
npm run format
```

### 添加新工具

1. 在 `src/mcp/tools/` 目录下创建新工具文件
2. 实现工具对象，包含 `name`、`description`、`inputSchema` 和 `handler`
3. 在 `src/mcp/server.js` 中注册新工具

### 错误处理

项目使用统一的错误处理机制：

- `ErrorHandler.asyncWrapper()`: 包装异步函数，自动处理错误
- `CustomError`: 自定义错误基类
- `ValidationError`: 参数验证错误
- `NetworkError`: 网络请求错误

## 📝 API 规范

### 响应格式

所有API响应都遵循统一格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  },
  "meta": {
    "operation": "操作名称",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔐 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `REMOTE_BASE_URL` | 远程服务器地址 | - | ✅ |
| `REMOTE_API_KEY` | API密钥 | - | ✅ |
| `API_VERSION` | API版本 | v1 | ❌ |
| `REQUEST_TIMEOUT` | 请求超时时间(ms) | 10000 | ❌ |
| `MAX_RETRIES` | 最大重试次数 | 3 | ❌ |
| `LOG_LEVEL` | 日志级别 | info | ❌ |

### 域名配置

确保使用的域名在远程短网址服务中已正确配置。

## 🚨 故障排除

### 常见问题

1. **连接失败**
   - 检查 `REMOTE_BASE_URL` 和 `REMOTE_API_KEY` 配置
   - 确认网络连接正常
   - 验证远程服务状态

2. **认证失败**
   - 确认 API 密钥正确
   - 检查密钥是否有足够权限

3. **参数验证失败**
   - 检查参数格式是否正确
   - 确认必填参数都已提供

### 日志调试

设置日志级别为 debug 查看详细信息：

```bash
LOG_LEVEL=debug npm start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果遇到问题或有建议，请：

1. 查看 [故障排除](#故障排除) 部分
2. 搜索现有的 [Issues](https://github.com/mliev/mliev-dwz-mcp/issues)
3. 创建新的 Issue 描述问题

## 📊 版本历史

- **v1.0.0** - 初始版本
  - 基本的短网址管理功能
  - MCP 协议支持
  - 完整的错误处理机制