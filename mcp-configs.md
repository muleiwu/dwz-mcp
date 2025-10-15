# MCP 客户端配置示例

本文档提供了在不同AI助手中配置Mliev短网址MCP客户端的示例。

## 📋 配置文件示例

### 1. 基础配置 (Claude Desktop)

```json
{
  "mcpServers": {
    "mliev-dwz": {
      "command": "node",
      "args": ["/path/mliev-dwz-mcp/src/index.js"],
      "env": {
        "REMOTE_BASE_URL": "https://dwz.test",
        "REMOTE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 2. 完整配置 (包含所有环境变量)

```json
{
  "mcpServers": {
    "mliev-dwz-client": {
      "command": "node",
      "args": ["/path/mliev-dwz-mcp/src/index.js"],
      "env": {
        "REMOTE_BASE_URL": "https://dwz.test",
        "REMOTE_API_KEY": "095570cad1784d2aed805fa70c481bfd0080e40c7602e6007fea42843889438f",
        "API_VERSION": "v1",
        "REQUEST_TIMEOUT": "10000",
        "MAX_RETRIES": "3",
        "RETRY_DELAY": "1000",
        "MCP_SERVER_NAME": "mliev-dwz-client",
        "MCP_SERVER_VERSION": "1.0.0",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## 🛠️ 不同AI助手的配置方式

### Claude Desktop

**配置文件位置**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

**配置示例**:
```json
{
  "mcpServers": {
    "mliev-dwz": {
      "command": "node",
      "args": ["/absolute/path/to/mliev-dwz-mcp/src/index.js"],
      "env": {
        "REMOTE_BASE_URL": "https://dwz.test",
        "REMOTE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Continue for VS Code

**配置文件**: `.continue/config.json`

**配置示例**:
```json
{
  "experimental": {
    "modelContextProtocol": {
      "servers": {
        "mliev-dwz": {
          "command": "node",
          "args": ["/path/to/mliev-dwz-mcp/src/index.js"],
          "env": {
            "REMOTE_BASE_URL": "https://dwz.test",
            "REMOTE_API_KEY": "your-api-key"
          }
        }
      }
    }
  }
}
```

### Cursor

**配置文件**: `.cursor/mcp.json`

**配置示例**:
```json
{
  "mcpServers": {
    "mliev-dwz": {
      "command": "node",
      "args": ["/path/to/mliev-dwz-mcp/src/index.js"],
      "env": {
        "REMOTE_BASE_URL": "https://dwz.test",
        "REMOTE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cline (Claude Dev)

**配置文件**: `.cline/settings.json`

**配置示例**:
```json
{
  "mcpServers": {
    "mliev-dwz": {
      "command": "node",
      "args": ["/path/to/mliev-dwz-mcp/src/index.js"],
      "env": {
        "REMOTE_BASE_URL": "https://dwz.test",
        "REMOTE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🔧 环境变量说明

### 必填变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `REMOTE_BASE_URL` | 远程API服务器地址 | `https://dwz.test` |
| `REMOTE_API_KEY` | API密钥 | `your-api-key-here` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `API_VERSION` | API版本 | `v1` |
| `REQUEST_TIMEOUT` | 请求超时时间(毫秒) | `10000` |
| `MAX_RETRIES` | 最大重试次数 | `3` |
| `RETRY_DELAY` | 重试间隔(毫秒) | `1000` |
| `MCP_SERVER_NAME` | MCP服务器名称 | `mliev-dwz-client` |
| `MCP_SERVER_VERSION` | MCP服务器版本 | `1.0.0` |
| `LOG_LEVEL` | 日志级别 | `info` |

## 🚀 快速开始步骤

### 1. 克隆或下载项目

```bash
git clone https://github.com/mliev/mliev-dwz-mcp.git
cd mliev-dwz-mcp
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

### 4. 测试运行

```bash
npm run dev
```

### 5. 配置AI助手

根据你使用的AI助手，选择对应的配置方式，将MCP服务器配置添加到相应的配置文件中。

## 📝 可用工具列表

配置完成后，AI助手将可以使用以下工具：

1. **create_short_url** - 创建短网址
2. **get_url_info** - 获取短网址信息
3. **list_short_urls** - 列出短网址
4. **delete_short_url** - 删除短网址
5. **batch_create_short_urls** - 批量创建短网址
6. **list_domains** - 获取域名列表

## 🔍 故障排除

### 常见问题

1. **路径错误**
   - 确保使用绝对路径
   - 检查Node.js是否正确安装

2. **权限问题**
   - 确保API密钥有效
   - 检查网络连接

3. **环境变量问题**
   - 确保所有必填变量都已设置
   - 检查变量值是否正确

### 调试模式

设置日志级别为debug来查看详细信息：

```json
"env": {
  "LOG_LEVEL": "debug"
}
```

### 测试连接

使用MCP Inspector测试连接：

```bash
npx @modelcontextprotocol/inspector node src/index.js
```

## 📚 更多资源

- [MCP官方文档](https://modelcontextprotocol.io/)
- [Claude Desktop MCP指南](https://docs.anthropic.com/claude/docs/mcp)
- [项目GitHub仓库](https://github.com/mliev/mliev-dwz-mcp)