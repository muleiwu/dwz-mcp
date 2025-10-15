/**
 * 参数验证工具模块
 * 基于 Joi 实现的参数验证功能，用于验证 MCP 工具的输入参数
 */

import Joi from 'joi';

/**
 * 通用验证规则
 */
const commonRules = {
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID 必须是数字',
    'number.integer': 'ID 必须是整数',
    'number.positive': 'ID 必须是正整数',
    'any.required': 'ID 是必填参数',
  }),

  url: Joi.string().uri().required().messages({
    'string.base': 'URL 必须是字符串',
    'string.uri': 'URL 格式不正确',
    'any.required': 'URL 是必填参数',
  }),

  optionalUrl: Joi.string().uri().optional().messages({
    'string.base': 'URL 必须是字符串',
    'string.uri': 'URL 格式不正确',
  }),

  domain: Joi.string().pattern(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional().messages({
    'string.base': '域名必须是字符串',
    'string.pattern.base': '域名格式不正确',
  }),

  customCode: Joi.string().alphanum().min(3).max(50).optional().messages({
    'string.base': '自定义代码必须是字符串',
    'string.alphanum': '自定义代码只能包含字母和数字',
    'string.min': '自定义代码至少需要 3 个字符',
    'string.max': '自定义代码不能超过 50 个字符',
  }),

  title: Joi.string().min(1).max(200).required().messages({
    'string.base': '标题必须是字符串',
    'string.empty': '标题不能为空',
    'string.min': '标题至少需要 1 个字符',
    'string.max': '标题不能超过 200 个字符',
    'any.required': '标题是必填参数',
  }),

  description: Joi.string().max(500).allow('').optional().messages({
    'string.base': '描述必须是字符串',
    'string.max': '描述不能超过 500 个字符',
  }),

  expireAt: Joi.date().iso().optional().allow(null).messages({
    'date.base': '过期时间必须是有效的日期',
    'date.format': '过期时间格式不正确，请使用 ISO 8601 格式',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': '激活状态必须是布尔值',
  }),

  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': '页码必须是数字',
    'number.integer': '页码必须是整数',
    'number.min': '页码必须大于 0',
  }),

  pageSize: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': '每页数量必须是数字',
    'number.integer': '每页数量必须是整数',
    'number.min': '每页数量必须大于 0',
    'number.max': '每页数量不能超过 100',
  }),

  keyword: Joi.string().max(100).allow('').optional().messages({
    'string.base': '关键词必须是字符串',
    'string.max': '关键词不能超过 100 个字符',
  }),

  days: Joi.number().integer().min(1).max(365).default(7).messages({
    'number.base': '天数必须是数字',
    'number.integer': '天数必须是整数',
    'number.min': '天数必须大于 0',
    'number.max': '天数不能超过 365',
  }),

  urls: Joi.array().items(Joi.string().uri().required()).min(1).max(50).required().messages({
    'array.base': 'URLs 必须是数组',
    'array.min': '至少需要提供一个 URL',
    'array.max': '最多只能提供 50 个 URL',
    'string.base': 'URL 必须是字符串',
    'string.uri': 'URL 格式不正确',
    'any.required': 'URLs 是必填参数',
  }),
};

/**
 * 各 MCP 工具的验证模式
 */
const schemas = {
  // 创建短网址
  createShortUrl: Joi.object({
    original_url: commonRules.url,
    domain: commonRules.domain.required().messages({
      'any.required': '域名是必填参数',
    }),
    custom_code: commonRules.customCode,
    title: commonRules.title,
    description: commonRules.description,
    expire_at: commonRules.expireAt,
  }),

  // 获取短网址信息
  getUrlInfo: Joi.object({
    id: commonRules.id,
  }),

  // 更新短网址
  updateShortUrl: Joi.object({
    id: commonRules.id,
    original_url: commonRules.optionalUrl,
    title: Joi.string().min(1).max(200).optional().messages({
      'string.base': '标题必须是字符串',
      'string.empty': '标题不能为空',
      'string.min': '标题至少需要 1 个字符',
      'string.max': '标题不能超过 200 个字符',
    }),
    description: commonRules.description,
    expire_at: commonRules.expireAt,
    is_active: commonRules.isActive,
  }).min(2).messages({
    'object.min': '更新请求至少需要提供一个要更新的字段',
  }),

  // 删除短网址
  deleteShortUrl: Joi.object({
    id: commonRules.id,
  }),

  // 批量创建短网址
  batchCreateShortUrls: Joi.object({
    urls: commonRules.urls,
    domain: commonRules.domain.required().messages({
      'any.required': '域名是必填参数',
    }),
  }),

  // 获取短网址统计
  getUrlStatistics: Joi.object({
    id: commonRules.id,
    days: commonRules.days,
  }),

  // 列出短网址
  listShortUrls: Joi.object({
    page: commonRules.page,
    page_size: commonRules.pageSize,
    domain: commonRules.domain,
    keyword: commonRules.keyword,
  }),
};

/**
 * 验证参数
 * @param {string} schemaName - 模式名称
 * @param {Object} data - 要验证的数据
 * @returns {Object} 验证结果
 */
function validate(schemaName, data) {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`未找到验证模式: ${schemaName}`);
  }

  const { error, value } = schema.validate(data, {
    abortEarly: false, // 返回所有验证错误
    stripUnknown: true, // 移除未知字段
    convert: true, // 自动类型转换
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    }));

    return {
      isValid: false,
      errors,
      data: null,
    };
  }

  return {
    isValid: true,
    errors: [],
    data: value,
  };
}

/**
 * 验证并抛出异常（如果验证失败）
 * @param {string} schemaName - 模式名称
 * @param {Object} data - 要验证的数据
 * @returns {Object} 验证后的数据
 */
function validateOrThrow(schemaName, data) {
  const result = validate(schemaName, data);

  if (!result.isValid) {
    const errorMessages = result.errors.map((error) => `${error.field}: ${error.message}`).join('; ');
    throw new Error(`参数验证失败: ${errorMessages}`);
  }

  return result.data;
}

/**
 * 检查是否为有效的 ID
 * @param {any} id - 要检查的 ID
 * @returns {boolean} 是否有效
 */
function isValidId(id) {
  try {
    commonRules.id.validate(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查是否为有效的 URL
 * @param {any} url - 要检查的 URL
 * @returns {boolean} 是否有效
 */
function isValidUrl(url) {
  try {
    commonRules.url.validate(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查是否为有效的域名
 * @param {any} domain - 要检查的域名
 * @returns {boolean} 是否有效
 */
function isValidDomain(domain) {
  try {
    commonRules.domain.validate(domain);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理和标准化 URL
 * @param {string} url - 要清理的 URL
 * @returns {string} 清理后的 URL
 */
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // 移除首尾的空白字符
  url = url.trim();

  // 如果没有协议，默认添加 https://
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

/**
 * 生成自定义代码（如果未提供）
 * @param {number} length - 代码长度
 * @returns {string} 生成的代码
 */
function generateCustomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 验证分页参数
 * @param {Object} params - 分页参数
 * @returns {Object} 标准化的分页参数
 */
function normalizePaginationParams(params = {}) {
  const page = Math.max(1, parseInt(params.page || 1, 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(params.page_size || 10, 10)));

  return {
    page,
    page_size: pageSize,
    offset: (page - 1) * pageSize,
  };
}

/**
 * 构建查询参数对象
 * @param {Object} params - 原始参数
 * @param {Array} allowedFields - 允许的字段列表
 * @returns {Object} 过滤后的查询参数
 */
function buildQueryParams(params, allowedFields = []) {
  const queryParams = {};

  for (const field of allowedFields) {
    if (params[field] !== undefined && params[field] !== null && params[field] !== '') {
      queryParams[field] = params[field];
    }
  }

  return queryParams;
}

export {
  commonRules,
  schemas,
  validate,
  validateOrThrow,
  isValidId,
  isValidUrl,
  isValidDomain,
  normalizeUrl,
  generateCustomCode,
  normalizePaginationParams,
  buildQueryParams,
};