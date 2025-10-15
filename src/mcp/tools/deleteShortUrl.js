/**
 * MCP 工具：删除短网址
 */

import defaultShortLinkService from '../../services/shortLinkService.js';
import { ErrorHandler } from '../../utils/errorHandler.js';
import { getLogger } from '../../config/remoteConfig.js';

const logger = getLogger();

export const deleteShortUrlTool = {
  name: 'delete_short_url',
  description: '删除指定的短网址。删除后无法恢复，请谨慎操作。',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: '要删除的短网址ID',
        minimum: 1,
      },
    },
    required: ['id'],
  },

  handler: async function (args) {
    logger.info('MCP工具调用: delete_short_url', { args });

    return ErrorHandler.asyncWrapper(async () => {
      const result = await defaultShortLinkService.deleteShortUrl(args.id);

      return {
        success: true,
        message: '短网址删除成功',
        data: {
          id: args.id,
          deleted: true,
        },
        meta: {
          operation: 'delete_short_url',
          timestamp: new Date().toISOString(),
        },
      };
    })();
  },
};

export default deleteShortUrlTool;