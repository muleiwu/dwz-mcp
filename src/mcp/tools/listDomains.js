/**
 * MCP 工具：获取域名列表
 * 为 AI 助手提供获取所有可用域名列表的功能
 */

import defaultShortLinkService from '../../services/shortLinkService.js';
import { ErrorHandler } from '../../utils/errorHandler.js';
import { getLogger } from '../../config/remoteConfig.js';

const logger = getLogger();

/**
 * MCP 工具定义：获取域名列表
 */
export const listDomainsTool = {
  name: 'list_domains',
  description: '获取所有可用的域名列表，包括域名配置信息和状态。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },

  /**
   * 处理工具调用
   * @param {Object} args - 工具参数
   * @returns {Promise<Object>} 工具执行结果
   */
  handler: async function (args) {
    logger.info('MCP工具调用: list_domains', { args });

    return ErrorHandler.asyncWrapper(async () => {
      // 调用服务层获取域名列表
      const result = await defaultShortLinkService.listDomains();

      // 格式化返回结果
      return {
        success: true,
        message: '获取域名列表成功',
        data: {
          domains: result.list || [],
          summary: {
            total: result.list?.length || 0,
            active: result.list?.filter(d => d.is_active).length || 0,
            inactive: result.list?.filter(d => !d.is_active).length || 0,
          },
        },
        meta: {
          operation: 'list_domains',
          timestamp: new Date().toISOString(),
        },
      };
    })();
  },
};

/**
 * 工具使用示例
 */
export const listDomainsExamples = [
  {
    name: '获取所有域名',
    description: '获取系统中所有配置的域名列表',
    input: {},
  },
];

/**
 * 工具帮助信息
 */
export const listDomainsHelp = {
  usage: `
## 获取域名列表工具使用指南

### 基本语法
\`\`\`json
{}
\`\`\`

### 无需参数
此工具不需要任何参数，直接调用即可获取所有域名信息。

### 返回信息
- **域名基本信息**: ID、域名、协议
- **网站信息**: 网站名称、备案信息
- **配置信息**: 是否激活、参数透传设置
- **时间信息**: 创建时间、更新时间

### 使用场景
1. 查看系统中所有可用的域名
2. 选择域名用于创建短网址
3. 检查域名的激活状态
4. 了解域名的配置信息
  `,
  tips: [
    '此工具不需要任何参数',
    '返回的域名列表包含所有配置的域名',
    '只有激活状态的域名才能用于创建短网址',
    'protocol字段显示域名使用的协议（http/https）',
    'pass_query_params表示是否透传查询参数',
  ],
  troubleshooting: [
    {
      problem: '获取失败：权限不足',
      solution: '确认您的API密钥有查看域名配置的权限',
    },
    {
      problem: '返回空列表',
      solution: '可能系统中没有配置任何域名，请联系管理员添加域名',
    },
  ],
  relatedTools: [
    'create_short_url - 使用域名创建短网址',
    'list_short_urls - 查看短网址列表',
  ],
};

export default listDomainsTool;