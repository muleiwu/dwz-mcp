/**
 * MCP 工具：获取短网址信息
 * 为 AI 助手提供获取短网址详细信息的功能
 */

import defaultShortLinkService from '../../services/shortLinkService.js';
import { ErrorHandler } from '../../utils/errorHandler.js';
import { getLogger } from '../../config/remoteConfig.js';

const logger = getLogger();

/**
 * MCP 工具定义：获取短网址信息
 */
export const getUrlInfoTool = {
  name: 'get_url_info',
  description: '根据短网址ID获取详细信息，包括原始URL、点击统计、创建时间等。',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: '短网址的唯一标识ID',
        minimum: 1,
        examples: [1, 123, 456],
      },
    },
    required: ['id'],
  },

  /**
   * 处理工具调用
   * @param {Object} args - 工具参数
   * @returns {Promise<Object>} 工具执行结果
   */
  handler: async function (args) {
    logger.info('MCP工具调用: get_url_info', { args });

    return ErrorHandler.asyncWrapper(async () => {
      // 调用服务层获取短链接信息
      const result = await defaultShortLinkService.getUrlInfo(args.id);

      // 格式化返回结果
      return {
        success: true,
        message: '获取短网址信息成功',
        data: {
          id: result.id,
          short_code: result.short_code,
          short_url: result.short_url,
          original_url: result.original_url,
          title: result.title,
          description: result.description,
          domain: result.domain,
          expire_at: result.expire_at,
          is_active: result.is_active,
          click_count: result.click_count,
          created_at: result.created_at,
          updated_at: result.updated_at,
        },
        meta: {
          operation: 'get_url_info',
          timestamp: new Date().toISOString(),
        },
      };
    })();
  },
};

/**
 * 工具使用示例
 */
export const getUrlInfoExamples = [
  {
    name: '基本查询',
    description: '获取指定ID的短网址信息',
    input: {
      id: 123,
    },
  },
  {
    name: '查询最新创建的链接',
    description: '获取最新创建的短网址详情',
    input: {
      id: 1,
    },
  },
];

/**
 * 工具帮助信息
 */
export const getUrlInfoHelp = {
  usage: `
## 获取短网址信息工具使用指南

### 基本语法
\`\`\`json
{
  "id": 123
}
\`\`\`

### 参数说明
- **id**: 短网址的唯一标识ID（必填，正整数）

### 返回信息
- **基本信息**: ID、短代码、短网址、原始URL
- **内容信息**: 标题、描述
- **状态信息**: 域名、过期时间、激活状态
- **统计信息**: 点击次数
- **时间信息**: 创建时间、更新时间

### 使用场景
1. 查看短网址对应的原始链接
2. 检查短网址的点击统计
3. 确认链接的有效期和状态
4. 获取链接的详细配置信息
  `,
  tips: [
    'ID必须是正整数，从1开始',
    '如果短网址不存在，会返回错误信息',
    '返回的short_url是完整的短链接地址',
    'click_count表示总点击次数',
    'expire_at为null表示永不过期',
  ],
  troubleshooting: [
    {
      problem: '获取失败：ID不存在',
      solution: '确认短网址ID是否正确，可以通过列表工具查看所有可用的ID',
    },
    {
      problem: '获取失败：权限不足',
      solution: '确认您有权限访问该短网址，或者检查API密钥配置',
    },
  ],
  relatedTools: [
    'list_short_urls - 查看所有短网址列表',
    'update_short_url - 更新短网址信息',
    'delete_short_url - 删除短网址',
    'get_url_statistics - 获取详细统计信息',
  ],
};

export default getUrlInfoTool;