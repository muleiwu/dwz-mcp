/**
 * MCP 工具：创建短网址
 * 为 AI 助手提供创建短网址的功能
 */

import defaultShortLinkService from '../../services/shortLinkService.js';
import { ErrorHandler } from '../../utils/errorHandler.js';
import { getLogger } from '../../config/remoteConfig.js';

const logger = getLogger();

/**
 * MCP 工具定义：创建短网址
 */
export const createShortUrlTool = {
  name: 'create_short_url',
  description: '创建一个新的短网址。支持自定义域名、短代码、标题和描述信息。',
  inputSchema: {
    type: 'object',
    properties: {
      original_url: {
        type: 'string',
        description: '原始URL地址（要缩短的长链接）',
        format: 'uri',
        examples: ['https://www.example.com/very/long/path', 'https://github.com/user/repo'],
      },
      domain: {
        type: 'string',
        description: '短网址使用的域名（必填）',
        pattern: '^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        examples: ['dwz.test', 'link.example.com'],
      },
      custom_code: {
        type: 'string',
        description: '自定义短代码（可选，如果不提供将自动生成）',
        pattern: '^[a-zA-Z0-9]{3,50}$',
        examples: ['abc123', 'mylink', 'promo2024'],
      },
      title: {
        type: 'string',
        description: '短网址的标题（必填）',
        minLength: 1,
        maxLength: 200,
        examples: ['产品官网', '活动页面', '技术文档'],
      },
      description: {
        type: 'string',
        description: '短网址的描述信息（可选）',
        maxLength: 500,
        examples: ['这是我们的新产品页面', '2024年春节促销活动'],
      },
      expire_at: {
        type: 'string',
        description: '过期时间（可选，ISO 8601格式，不填表示永不过期）',
        format: 'date-time',
        examples: ['2024-12-31T23:59:59Z', '2025-01-01T00:00:00+08:00'],
      },
    },
    required: ['original_url', 'domain', 'title'],
  },

  /**
   * 处理工具调用
   * @param {Object} args - 工具参数
   * @returns {Promise<Object>} 工具执行结果
   */
  handler: async function (args) {
    logger.info('MCP工具调用: create_short_url', { args });

    return ErrorHandler.asyncWrapper(async () => {
      // 调用服务层创建短链接
      const result = await defaultShortLinkService.createShortUrl(args);

      // 格式化返回结果
      return {
        success: true,
        message: '短网址创建成功',
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
          operation: 'create_short_url',
          timestamp: new Date().toISOString(),
        },
      };
    })();
  },
};

/**
 * 工具使用示例
 */
export const createShortUrlExamples = [
  {
    name: '基本创建',
    description: '创建一个基本的短网址',
    input: {
      original_url: 'https://www.example.com/products/new-laptop',
      domain: 'short.ly',
      title: '新款笔记本电脑',
    },
  },
  {
    name: '自定义短代码',
    description: '使用自定义短代码创建短网址',
    input: {
      original_url: 'https://github.com/user/awesome-project',
      domain: 'dwz.test',
      custom_code: 'awesome',
      title: '超赞项目',
      description: '一个开源的GitHub项目',
    },
  },
  {
    name: '设置过期时间',
    description: '创建有过期时间的短网址',
    input: {
      original_url: 'https://example.com/promotion/2024',
      domain: 'short.ly',
      title: '2024年促销活动',
      description: '限时促销活动页面',
      expire_at: '2024-12-31T23:59:59Z',
    },
  },
];

/**
 * 工具帮助信息
 */
export const createShortUrlHelp = {
  usage: `
## 创建短网址工具使用指南

### 基本语法
\`\`\`json
{
  "original_url": "https://example.com/very/long/path",
  "domain": "short.ly",
  "title": "网页标题",
  "description": "可选的描述信息",
  "custom_code": "可选的自定义代码",
  "expire_at": "可选的过期时间"
}
\`\`\`

### 必填参数
- **original_url**: 要缩短的原始URL地址
- **domain**: 短网址使用的域名
- **title**: 短网址的标题

### 可选参数
- **custom_code**: 自定义短代码（3-50个字母数字字符）
- **description**: 描述信息（最多500个字符）
- **expire_at**: 过期时间（ISO 8601格式）

### 使用建议
1. 确保原始URL是有效的且可以访问
2. 选择合适的域名，域名需要在系统中配置
3. 标题应该简洁明了，便于识别
4. 自定义代码如果冲突，建议使用其他代码
5. 对于临时活动，建议设置过期时间
  `,
  tips: [
    '原始URL会自动添加https://前缀（如果没有协议）',
    '自定义代码只能包含字母和数字，长度3-50字符',
    '标题是必填的，用于标识链接用途',
    '过期时间使用ISO 8601格式，如：2024-12-31T23:59:59Z',
    '创建后可以随时通过其他工具修改链接信息',
  ],
  troubleshooting: [
    {
      problem: '创建失败：域名无效',
      solution: '检查域名格式是否正确，确保域名已在系统中配置',
    },
    {
      problem: '创建失败：自定义代码冲突',
      solution: '尝试使用其他自定义代码，或者不提供自定义代码让系统自动生成',
    },
    {
      problem: '创建失败：标题过长',
      solution: '标题长度限制为200个字符，请缩短标题',
    },
  ],
};

export default createShortUrlTool;