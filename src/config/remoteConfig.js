/**
 * 远程服务配置管理模块
 * 负责管理远程短网址服务的配置信息
 */

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 默认配置
const DEFAULT_CONFIG = {
  // 远程服务器配置
  REMOTE_BASE_URL: process.env.REMOTE_BASE_URL || 'https://api.example.com',
  REMOTE_API_KEY: process.env.REMOTE_API_KEY || '',

  // API 版本
  API_VERSION: process.env.API_VERSION || 'v1',

  // 请求配置
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '10000', 10), // 10秒
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '1000', 10), // 1秒

  // MCP 服务器配置
  MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'mliev-dwz-client',
  MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',

  // 日志配置
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// API 端点配置
const API_ENDPOINTS = {
  // 短链接相关
  CREATE_SHORT_URL: '/shortlinks',
  LIST_SHORT_URLS: '/short_links',
  GET_SHORT_URL: '/shortlinks',
  UPDATE_SHORT_URL: '/shortlinks',
  DELETE_SHORT_URL: '/shortlinks',
  BATCH_CREATE_SHORT_URLS: '/shortlinks/batch',
  GET_URL_STATISTICS: '/shortlinks/statistics',

  // 域名管理相关（暂不暴露给MCP客户端）
  CREATE_DOMAIN: '/domains',
};

/**
 * 获取完整的API端点URL
 * @param {string} endpoint - API端点
 * @returns {string} 完整的URL
 */
function getApiUrl(endpoint) {
  const baseUrl = DEFAULT_CONFIG.REMOTE_BASE_URL.replace(/\/$/, '');
  const apiVersion = DEFAULT_CONFIG.API_VERSION;
  return `${baseUrl}/api/${apiVersion}${endpoint}`;
}

/**
 * 获取请求头配置
 * @returns {Object} 请求头对象
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': `${DEFAULT_CONFIG.MCP_SERVER_NAME}/${DEFAULT_CONFIG.MCP_SERVER_VERSION}`,
  };

  if (DEFAULT_CONFIG.REMOTE_API_KEY) {
    headers.Authorization = `Bearer ${DEFAULT_CONFIG.REMOTE_API_KEY}`;
  }

  return headers;
}

/**
 * 验证必要的配置是否存在
 * @returns {boolean} 配置是否有效
 */
function validateConfig() {
  const required = ['REMOTE_BASE_URL', 'REMOTE_API_KEY'];

  for (const key of required) {
    if (!DEFAULT_CONFIG[key]) {
      console.error(`配置错误: 缺少必要的环境变量 ${key}`);
      return false;
    }
  }

  return true;
}

/**
 * 获取HTTP请求配置
 * @param {Object} options - 额外的请求选项
 * @returns {Object} 请求配置对象
 */
function getRequestConfig(options = {}) {
  return {
    timeout: DEFAULT_CONFIG.REQUEST_TIMEOUT,
    maxRetries: DEFAULT_CONFIG.MAX_RETRIES,
    retryDelay: DEFAULT_CONFIG.RETRY_DELAY,
    headers: getHeaders(),
    ...options,
  };
}

/**
 * 获取所有配置（用于调试）
 * @returns {Object} 配置对象（不包含敏感信息）
 */
function getConfigForDebug() {
  const { REMOTE_API_KEY, ...safeConfig } = DEFAULT_CONFIG;
  return {
    ...safeConfig,
    REMOTE_API_KEY: REMOTE_API_KEY ? '***已配置***' : '未配置',
  };
}

/**
 * 检查URL是否有效
 * @param {string} url - 要检查的URL
 * @returns {boolean} URL是否有效
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取日志记录器
 * @returns {Object} 日志记录器对象
 */
function getLogger() {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  const currentLevel = levels[DEFAULT_CONFIG.LOG_LEVEL] || levels.info;

  return {
    error: (message, ...args) => {
      if (currentLevel >= levels.error) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
      }
    },
    warn: (message, ...args) => {
      if (currentLevel >= levels.warn) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
      }
    },
    info: (message, ...args) => {
      if (currentLevel >= levels.info) {
        console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
      }
    },
    debug: (message, ...args) => {
      if (currentLevel >= levels.debug) {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
      }
    },
  };
}

export {
  DEFAULT_CONFIG,
  API_ENDPOINTS,
  getApiUrl,
  getHeaders,
  validateConfig,
  getRequestConfig,
  getConfigForDebug,
  isValidUrl,
  getLogger,
};