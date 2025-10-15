/**
 * MCP 服务器主文件
 * 实现 MCP 协议的服务器端，为 AI 助手提供短网址管理工具
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { DEFAULT_CONFIG, getLogger, validateConfig } from '../config/remoteConfig.js';
import defaultShortLinkService from '../services/shortLinkService.js';

// 导入所有工具
import createShortUrlTool from './tools/createShortUrl.js';
import getUrlInfoTool from './tools/getUrlInfo.js';
import listShortUrlsTool from './tools/listShortUrls.js';
import deleteShortUrlTool from './tools/deleteShortUrl.js';
import batchCreateShortUrlsTool from './tools/batchCreateShortUrls.js';
import listDomainsTool from './tools/listDomains.js';

const logger = getLogger();

/**
 * MCP 服务器类
 */
class McpShortLinkServer {
  constructor() {
    this.server = null;
    this.tools = new Map();
    this.initializeServer();
  }

  /**
   * 初始化服务器
   */
  initializeServer() {
    // 验证配置
    if (!validateConfig()) {
      throw new Error('MCP 服务器配置无效，请检查环境变量');
    }

    // 创建 MCP 服务器实例
    this.server = new Server(
      {
        name: DEFAULT_CONFIG.MCP_SERVER_NAME,
        version: DEFAULT_CONFIG.MCP_SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 注册所有工具
    this.registerTools();

    // 设置请求处理器
    this.setupRequestHandlers();

    logger.info('MCP 服务器初始化完成');
  }

  /**
   * 注册所有工具
   */
  registerTools() {
    const tools = [
      createShortUrlTool,
      getUrlInfoTool,
      listShortUrlsTool,
      deleteShortUrlTool,
      batchCreateShortUrlsTool,
      listDomainsTool,
    ];

    for (const tool of tools) {
      this.tools.set(tool.name, tool);
      logger.debug(`注册工具: ${tool.name}`);
    }

    logger.info(`已注册 ${tools.length} 个工具`);
  }

  /**
   * 设置请求处理器
   */
  setupRequestHandlers() {
    // 处理工具列表请求
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('收到工具列表请求');

      const toolList = Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return { tools: toolList };
    });

    // 处理工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`收到工具调用请求: ${name}`, { args });

      // 检查工具是否存在
      const tool = this.tools.get(name);
      if (!tool) {
        logger.error(`未知工具: ${name}`);
        throw new McpError(
          ErrorCode.MethodNotFound,
          `未找到工具: ${name}`
        );
      }

      try {
        // 调用工具处理器
        const result = await tool.handler(args);

        logger.info(`工具 ${name} 执行成功`, {
          success: result.success,
          dataKeys: result.data ? Object.keys(result.data) : [],
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };

      } catch (error) {
        logger.error(`工具 ${name} 执行失败:`, error);

        // 如果已经是 McpError，直接抛出
        if (error instanceof McpError) {
          throw error;
        }

        // 转换为 McpError
        const errorMessage = error.message || '工具执行失败';
        throw new McpError(
          ErrorCode.InternalError,
          `工具 ${name} 执行失败: ${errorMessage}`
        );
      }
    });

    logger.debug('请求处理器设置完成');
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      logger.info('启动 MCP 服务器...');

      // 检查远程服务连接
      await this.checkRemoteService();

      // 创建传输层
      const transport = new StdioServerTransport();

      // 连接服务器
      await this.server.connect(transport);

      logger.info('MCP 服务器启动成功，等待连接...');

      // 设置优雅关闭
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('MCP 服务器启动失败:', error);
      process.exit(1);
    }
  }

  /**
   * 检查远程服务连接
   */
  async checkRemoteService() {
    try {
      logger.info('检查远程服务连接...');
      const status = await defaultShortLinkService.getServiceStatus();

      if (status.status === 'healthy') {
        logger.info('远程服务连接正常');
      } else {
        logger.warn('远程服务状态异常:', status);
      }
    } catch (error) {
      logger.error('无法连接到远程服务:', error);
      throw new Error('远程服务连接失败，请检查网络和配置');
    }
  }

  /**
   * 设置优雅关闭
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`收到 ${signal} 信号，开始关闭服务器...`);

      try {
        // 关闭 MCP 服务器
        if (this.server) {
          await this.server.close();
          logger.info('MCP 服务器已关闭');
        }

        process.exit(0);
      } catch (error) {
        logger.error('关闭服务器时出错:', error);
        process.exit(1);
      }
    };

    // 监听关闭信号
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // 监听未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的 Promise 拒绝:', { reason, promise });
      shutdown('unhandledRejection');
    });
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      name: DEFAULT_CONFIG.MCP_SERVER_NAME,
      version: DEFAULT_CONFIG.MCP_SERVER_VERSION,
      tools_count: this.tools.size,
      tools: Array.from(this.tools.keys()),
      config: {
        remote_base_url: DEFAULT_CONFIG.REMOTE_BASE_URL,
        api_version: DEFAULT_CONFIG.API_VERSION,
        request_timeout: DEFAULT_CONFIG.REQUEST_TIMEOUT,
      },
    };
  }
}

/**
 * 创建并启动服务器
 */
async function createAndStartServer() {
  const server = new McpShortLinkServer();
  await server.start();
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  createAndStartServer().catch((error) => {
    console.error('启动服务器失败:', error);
    process.exit(1);
  });
}

export { McpShortLinkServer, createAndStartServer };
export default McpShortLinkServer;