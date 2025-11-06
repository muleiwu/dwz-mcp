# Mliev Short URL MCP Client

A short URL management client based on MCP (Model Context Protocol) protocol, providing complete short URL generation, management, and statistics functionality for AI assistants. This MCP server is implemented based on the API interface of the [dwz-server](https://github.com/muleiwu/dwz-server) project.

<a href="https://glama.ai/mcp/servers/@muleiwu/dwz-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@muleiwu/dwz-mcp/badge" alt="DWZ Short URL Server MCP server" />
</a>

## 🏛️ Server Architecture

This MCP client calls the short URL service API based on the [dwz-server](https://github.com/muleiwu/dwz-server) project. dwz-server is a high-performance short URL service developed in Go language, providing complete short URL generation, management, and statistics functionality.

### Deploy dwz-server with Docker

It is recommended to deploy dwz-server using Docker as the backend service for the MCP client:

```yaml
# docker-compose.yml
services:
  dwz-server:
    container_name: dwz-server
    image: docker.cnb.cool/mliev/open/dwz-server:latest
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - "./config/:/app/config/"
    environment:
      - TZ=Asia/Shanghai
      - GIN_MODE=release
```

Start the service:

```bash
docker-compose up -d
```

After the service starts, the API address will be `http://localhost:8080`. Configure it in the MCP client:

```bash
REMOTE_BASE_URL=http://localhost:8080
```

## ✨ Features

- 🔗 **Short URL Creation**: Support custom domains, short codes, titles, and descriptions
- 📋 **Batch Operations**: Create multiple short URLs at once to improve efficiency
- 🔍 **Search & Filter**: Support domain filtering and keyword search
- 📊 **Statistics & Analytics**: Get detailed click statistics information
- 🛡️ **Error Handling**: Comprehensive error handling and retry mechanisms
- 🔒 **Security Authentication**: API authentication based on Bearer Token

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Direct MCP Usage

```json
{
  "mcpServers": {
    "dwz-mcp": {
      "name": "dwz-mcp",
      "type": "stdio",
      "isActive": true,
      "registryUrl": "",
      "command": "npx",
      "args": [
        "-y",
        "@muleiwu/dwz-mcp"
      ],
      "env": {
        "REMOTE_BASE_URL": "Your short URL service address",
        "REMOTE_API_KEY": "apiKey"
      }
    }
  }
}
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Copy the environment variable template and configure:

```bash
cp .env.example .env
```

Edit the `.env` file:

```bash
# Remote short URL server configuration
REMOTE_BASE_URL=https://api.example.com
REMOTE_API_KEY=your-api-key-here

# Other optional configuration
REQUEST_TIMEOUT=10000
MAX_RETRIES=3
LOG_LEVEL=info
```

### Start Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📖 MCP Tool List

### 1. create_short_url
Create a new short URL

**Parameters:**
- `original_url` (required): Original URL address
- `domain` (required): Short URL domain
- `title` (required): Web page title
- `custom_code` (optional): Custom short code
- `description` (optional): Description information
- `expire_at` (optional): Expiration time

**Example:**
```json
{
  "original_url": "https://www.example.com/products",
  "domain": "short.ly",
  "title": "Product Page",
  "description": "Our product showcase page",
  "custom_code": "products"
}
```

### 2. get_url_info
Get detailed information about a short URL

**Parameters:**
- `id` (required): Short URL ID

**Example:**
```json
{
  "id": 123
}
```

### 3. list_short_urls
List short URLs with pagination and search support

**Parameters:**
- `page` (optional): Page number, default 1
- `page_size` (optional): Items per page, default 10
- `domain` (optional): Domain filter
- `keyword` (optional): Search keyword

**Example:**
```json
{
  "page": 1,
  "page_size": 20,
  "domain": "short.ly",
  "keyword": "product"
}
```

### 4. delete_short_url
Delete a short URL

**Parameters:**
- `id` (required): Short URL ID

**Example:**
```json
{
  "id": 123
}
```

### 5. batch_create_short_urls
Batch create short URLs

**Parameters:**
- `urls` (required): URL array (maximum 50)
- `domain` (required): Short URL domain

**Example:**
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
Get list of all available domains

**Parameters:** None required

**Example:**
```json
{}
```

**Return Information:**
- Domain basic information: ID, domain, protocol
- Website information: website name, registration information
- Configuration information: activation status, parameter pass-through settings
- Statistics information: total count, active count, inactive count

## 🏗️ Project Structure

```
mliev-dwz-mcp/
├── src/
│   ├── index.js                 # Entry file
│   ├── config/
│   │   └── remoteConfig.js      # Configuration management
│   ├── services/
│   │   ├── httpClient.js        # HTTP client
│   │   └── shortLinkService.js  # Short link service
│   ├── utils/
│   │   ├── validation.js        # Parameter validation
│   │   └── errorHandler.js      # Error handling
│   └── mcp/
│       ├── server.js            # MCP server
│       └── tools/               # MCP tools
│           ├── createShortUrl.js
│           ├── getUrlInfo.js
│           ├── listShortUrls.js
│           ├── deleteShortUrl.js
│           ├── batchCreateShortUrls.js
│           └── listDomains.js
├── tests/                       # Test files
├── package.json                 # Project configuration
├── .env.example                 # Environment variable template
└── README.md                    # Project documentation
```

## 🔧 Development Guide

### Available Scripts

```bash
# Start development server (hot reload)
npm run dev

# Build project
npm run build

# Run production environment
npm start

# Run tests
npm test

# Code linting
npm run lint

# Auto-fix code formatting
npm run format
```

### Adding New Tools

1. Create a new tool file in the `src/mcp/tools/` directory
2. Implement the tool object, including `name`, `description`, `inputSchema`, and `handler`
3. Register the new tool in `src/mcp/server.js`

### Error Handling

The project uses a unified error handling mechanism:

- `ErrorHandler.asyncWrapper()`: Wrap async functions, automatically handle errors
- `CustomError`: Custom error base class
- `ValidationError`: Parameter validation error
- `NetworkError`: Network request error

## 📝 API Specification

### Response Format

All API responses follow a unified format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "meta": {
    "operation": "Operation name",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔐 Configuration Instructions

### Environment Variables

| Variable Name | Description | Default Value | Required |
|---------------|-------------|---------------|----------|
| `REMOTE_BASE_URL` | Remote server address | - | ✅ |
| `REMOTE_API_KEY` | API key | - | ✅ |
| `API_VERSION` | API version | v1 | ❌ |
| `REQUEST_TIMEOUT` | Request timeout (ms) | 10000 | ❌ |
| `MAX_RETRIES` | Maximum retry count | 3 | ❌ |
| `LOG_LEVEL` | Log level | info | ❌ |

### Domain Configuration

Ensure that the domains used are correctly configured in the remote short URL service.

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check `REMOTE_BASE_URL` and `REMOTE_API_KEY` configuration
   - Confirm network connection is normal
   - Verify remote service status

2. **Authentication Failed**
   - Confirm API key is correct
   - Check if the key has sufficient permissions

3. **Parameter Validation Failed**
   - Check if parameter format is correct
   - Confirm all required parameters are provided

### Log Debugging

Set log level to debug to view detailed information:

```bash
LOG_LEVEL=debug npm start
```

## 🤝 Contributing Guide

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter problems or have suggestions, please:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [Issues](https://github.com/muleiwu/dwz-mcp/issues)
3. Create a new Issue describing the problem

## 📊 Version History

- **v1.0.0** - Initial version
  - Basic short URL management functionality
  - MCP protocol support
  - Complete error handling mechanism