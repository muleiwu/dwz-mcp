/**
 * MCP 工具：列出短网址
 * 为 AI 助手提供列出短网址的功能，支持分页和搜索
 */

import defaultShortLinkService from '../../services/shortLinkService.js';
import { ErrorHandler } from '../../utils/errorHandler.js';
import { getLogger } from '../../config/remoteConfig.js';

const logger = getLogger();

/**
 * MCP 工具定义：列出短网址
 */
export const listShortUrlsTool = {
  name: 'list_short_urls',
  description: '列出用户的短网址列表，支持分页、域名筛选和关键词搜索。',
  inputSchema: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        description: '页码，从1开始',
        minimum: 1,
        default: 1,
        examples: [1, 2, 3],
      },
      page_size: {
        type: 'integer',
        description: '每页数量，最大100，默认10',
        minimum: 1,
        maximum: 100,
        default: 10,
        examples: [10, 20, 50],
      },
      domain: {
        type: 'string',
        description: '按域名筛选（可选）',
        pattern: '^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        examples: ['short.ly', 'n3.ink'],
      },
      keyword: {
        type: 'string',
        description: '搜索关键词，搜索URL、标题或描述（可选）',
        maxLength: 100,
        examples: ['产品', '活动', 'github.com'],
      },
    },
    required: [],
  },

  /**
   * 处理工具调用
   * @param {Object} args - 工具参数
   * @returns {Promise<Object>} 工具执行结果
   */
  handler: async function (args) {
    logger.info('MCP工具调用: list_short_urls', { args });

    return ErrorHandler.asyncWrapper(async () => {
      // 调用服务层获取短链接列表
      const result = await defaultShortLinkService.listShortUrls(args);

      // 格式化返回结果
      return {
        success: true,
        message: '获取短网址列表成功',
        data: {
          list: result.list || [],
          pagination: {
            total: result.total,
            page: result.page,
            size: result.size,
            total_pages: Math.ceil(result.total / result.size),
          },
        },
        meta: {
          operation: 'list_short_urls',
          timestamp: new Date().toISOString(),
          filters: {
            domain: args.domain || null,
            keyword: args.keyword || null,
          },
        },
      };
    })();
  },
};

export default listShortUrlsTool;