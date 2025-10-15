/**
 * MCP 工具：批量创建短网址
 */

import defaultShortLinkService from '../../services/shortLinkService.js';
import { ErrorHandler } from '../../utils/errorHandler.js';
import { getLogger } from '../../config/remoteConfig.js';

const logger = getLogger();

export const batchCreateShortUrlsTool = {
  name: 'batch_create_short_urls',
  description: '批量创建多个短网址，提高创建效率。最多支持50个URL。',
  inputSchema: {
    type: 'object',
    properties: {
      urls: {
        type: 'array',
        description: '要缩短的URL列表',
        items: {
          type: 'string',
          format: 'uri',
        },
        minItems: 1,
        maxItems: 50,
      },
      domain: {
        type: 'string',
        description: '短网址使用的域名',
        pattern: '^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      },
    },
    required: ['urls', 'domain'],
  },

  handler: async function (args) {
    logger.info('MCP工具调用: batch_create_short_urls', { urlCount: args.urls.length });

    return ErrorHandler.asyncWrapper(async () => {
      const result = await defaultShortLinkService.batchCreateShortUrls(args);

      return {
        success: true,
        message: '批量创建完成',
        data: {
          success: result.success || [],
          failed: result.failed || [],
          summary: {
            total: args.urls.length,
            success_count: result.success?.length || 0,
            failed_count: result.failed?.length || 0,
          },
        },
        meta: {
          operation: 'batch_create_short_urls',
          timestamp: new Date().toISOString(),
        },
      };
    })();
  },
};

export default batchCreateShortUrlsTool;