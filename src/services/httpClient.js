/**
 * HTTP 客户端封装模块
 * 基于 axios 实现的 HTTP 请求客户端，支持重试、超时、错误处理等功能
 */

import axios from 'axios';
import { DEFAULT_CONFIG, getRequestConfig, getLogger } from '../config/remoteConfig.js';

const logger = getLogger();

/**
 * 清理请求头，移除敏感信息
 * @param {Object} headers - 请求头对象
 * @returns {Object} 清理后的请求头
 */
function sanitizeHeaders(headers) {
  if (!headers) return null;

  const sanitized = { ...headers };
  const sensitiveKeys = ['authorization', 'api-key', 'x-api-key', 'token', 'cookie'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * 创建 axios 实例
 * @param {Object} customConfig - 自定义配置
 * @returns {Object} axios 实例
 */
function createAxiosInstance(customConfig = {}) {
  const config = getRequestConfig(customConfig);

  const instance = axios.create({
    timeout: config.timeout,
    headers: config.headers,
    validateStatus: (status) => {
      // 认为 2xx 和 3xx 都是成功状态码
      return status >= 200 && status < 400;
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (requestConfig) => {
      logger.debug(`发送 ${requestConfig.method?.toUpperCase()} 请求到 ${requestConfig.url}`, {
        headers: requestConfig.headers,
        data: requestConfig.data,
      });
      return requestConfig;
    },
    (error) => {
      logger.error('请求拦截器错误:', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      logger.debug(`收到响应 ${response.status} 从 ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataSize: JSON.stringify(response.data || {}).length,
        data: response.data,
      });
      return response;
    },
    (error) => {
      // 详细的错误日志
      logger.error('HTTP请求失败:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        code: error.code,
        config: error.config ? {
          headers: sanitizeHeaders(error.config.headers),
          data: error.config.data,
          params: error.config.params,
          timeout: error.config.timeout,
        } : null,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: sanitizeHeaders(error.response.headers),
          data: error.response.data,
        } : null,
        stack: error.stack,
      });

      // 在调试模式下添加更详细的错误信息
      if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
        console.error('🔍 详细错误信息:', {
          request: {
            url: error.config?.url,
            method: error.config?.method,
            headers: sanitizeHeaders(error.config?.headers),
            data: error.config?.data,
          },
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: sanitizeHeaders(error.response.headers),
            data: error.response.data,
          } : null,
          error: {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack,
          },
        });
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise 对象
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 指数退避重试策略
 * @param {number} attemptNumber - 当前重试次数
 * @param {number} baseDelay - 基础延迟时间
 * @returns {number} 计算后的延迟时间
 */
function getExponentialBackoffDelay(attemptNumber, baseDelay) {
  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
  // 添加随机抖动，避免同时重试
  const jitter = Math.random() * 0.1 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, 30000); // 最大延迟 30 秒
}

/**
 * 执行带重试的 HTTP 请求
 * @param {Function} requestFn - 请求函数
 * @param {Object} options - 选项
 * @returns {Promise} Promise 对象
 */
async function executeWithRetry(requestFn, options = {}) {
  const { maxRetries = DEFAULT_CONFIG.MAX_RETRIES, retryDelay = DEFAULT_CONFIG.RETRY_DELAY } = options;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // 如果是最后一次尝试，直接抛出错误
      if (attempt > maxRetries) {
        logger.error(`请求失败，已达到最大重试次数 ${maxRetries}:`, error.message);
        throw error;
      }

      // 某些错误类型不应该重试
      if (shouldNotRetry(error)) {
        logger.debug('错误类型不适合重试，直接抛出:', error.message);
        throw error;
      }

      const delayMs = getExponentialBackoffDelay(attempt, retryDelay);
      logger.warn(`请求失败，${delayMs}ms 后进行第 ${attempt} 次重试:`, error.message);
      await delay(delayMs);
    }
  }

  throw lastError;
}

/**
 * 判断错误是否应该重试
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
function shouldNotRetry(error) {
  // 认证错误不应该重试
  if (error.response?.status === 401) {
    return true;
  }

  // 客户端错误（4xx）不应该重试
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return true;
  }

  // 网络错误或超时错误可以重试
  return false;
}

/**
 * HTTP 客户端类
 */
class HttpClient {
  constructor() {
    this.instance = createAxiosInstance();
  }

  /**
   * 执行 GET 请求
   * @param {string} url - 请求 URL
   * @param {Object} params - 查询参数
   * @param {Object} options - 额外选项
   * @returns {Promise} Promise 对象
   */
  async get(url, params = {}, options = {}) {
    const config = { params, ...options };
    this.logDetailedRequest('GET', url, config);

    return executeWithRetry(
      async () => {
        const startTime = Date.now();
        const response = await this.instance.get(url, config);

        // 计算请求耗时
        const duration = Date.now() - startTime;
        response.config.metadata = { duration };

        this.logDetailedResponse(response);
        return response.data;
      },
      options
    );
  }

  /**
   * 执行 POST 请求
   * @param {string} url - 请求 URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 额外选项
   * @returns {Promise} Promise 对象
   */
  async post(url, data = {}, options = {}) {
    const config = { ...options };
    this.logDetailedRequest('POST', url, { ...config, data });

    return executeWithRetry(
      async () => {
        const startTime = Date.now();
        const response = await this.instance.post(url, data, config);

        // 计算请求耗时
        const duration = Date.now() - startTime;
        response.config.metadata = { duration };

        this.logDetailedResponse(response);
        return response.data;
      },
      options
    );
  }

  /**
   * 执行 PUT 请求
   * @param {string} url - 请求 URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 额外选项
   * @returns {Promise} Promise 对象
   */
  async put(url, data = {}, options = {}) {
    const config = { ...options };
    this.logDetailedRequest('PUT', url, { ...config, data });

    return executeWithRetry(
      async () => {
        const startTime = Date.now();
        const response = await this.instance.put(url, data, config);

        // 计算请求耗时
        const duration = Date.now() - startTime;
        response.config.metadata = { duration };

        this.logDetailedResponse(response);
        return response.data;
      },
      options
    );
  }

  /**
   * 执行 DELETE 请求
   * @param {string} url - 请求 URL
   * @param {Object} options - 额外选项
   * @returns {Promise} Promise 对象
   */
  async delete(url, options = {}) {
    const config = { ...options };
    this.logDetailedRequest('DELETE', url, config);

    return executeWithRetry(
      async () => {
        const startTime = Date.now();
        const response = await this.instance.delete(url, config);

        // 计算请求耗时
        const duration = Date.now() - startTime;
        response.config.metadata = { duration };

        this.logDetailedResponse(response);
        return response.data;
      },
      options
    );
  }

  /**
   * 执行 PATCH 请求
   * @param {string} url - 请求 URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 额外选项
   * @returns {Promise} Promise 对象
   */
  async patch(url, data = {}, options = {}) {
    const config = { ...options };
    this.logDetailedRequest('PATCH', url, { ...config, data });

    return executeWithRetry(
      async () => {
        const startTime = Date.now();
        const response = await this.instance.patch(url, data, config);

        // 计算请求耗时
        const duration = Date.now() - startTime;
        response.config.metadata = { duration };

        this.logDetailedResponse(response);
        return response.data;
      },
      options
    );
  }

  /**
   * 设置默认请求头
   * @param {Object} headers - 请求头对象
   */
  setDefaultHeaders(headers) {
    Object.assign(this.instance.defaults.headers.common, headers);
  }

  /**
   * 设置基础 URL
   * @param {string} baseUrl - 基础 URL
   */
  setBaseUrl(baseUrl) {
    this.instance.defaults.baseURL = baseUrl;
  }

  /**
   * 取消请求
   * @param {string} requestId - 请求 ID
   */
  cancelRequest(requestId) {
    if (this.activeRequests && this.activeRequests[requestId]) {
      this.activeRequests[requestId].cancel();
      delete this.activeRequests[requestId];
    }
  }

  /**
   * 取消所有请求
   */
  cancelAllRequests() {
    if (this.activeRequests) {
      Object.keys(this.activeRequests).forEach((requestId) => {
        this.activeRequests[requestId].cancel();
      });
      this.activeRequests = {};
    }
  }

  /**
   * 检查是否为调试模式
   * @returns {boolean} 是否为调试模式
   */
  isDebugEnabled() {
    return process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development';
  }

  /**
   * 清理请求头，移除敏感信息
   * @param {Object} headers - 请求头对象
   * @returns {Object} 清理后的请求头
   */
  sanitizeHeaders(headers) {
    if (!headers) return null;

    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'api-key', 'x-api-key', 'token', 'cookie'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * 记录详细的请求信息
   * @param {string} method - HTTP方法
   * @param {string} url - 请求URL
   * @param {Object} config - 请求配置
   */
  logDetailedRequest(method, url, config) {
    if (!this.isDebugEnabled()) return;

    console.log('🔍 详细请求信息:', {
      method,
      url,
      headers: this.sanitizeHeaders(config.headers),
      data: config.data,
      params: config.params,
      timeout: config.timeout,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 记录详细的响应信息
   * @param {Object} response - HTTP响应
   */
  logDetailedResponse(response) {
    if (!this.isDebugEnabled()) return;

    console.log('📥 详细响应信息:', {
      status: response.status,
      statusText: response.statusText,
      headers: this.sanitizeHeaders(response.headers),
      dataSize: JSON.stringify(response.data || {}).length,
      data: response.data,
      duration: response.config?.metadata?.duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 记录详细的错误信息
   * @param {Error} error - 错误对象
   * @param {Object} config - 请求配置
   */
  logDetailedError(error, config) {
    if (!this.isDebugEnabled()) return;

    console.error('💥 详细错误信息:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      config: config ? {
        url: config.url,
        method: config.method,
        headers: this.sanitizeHeaders(config.headers),
        data: config.data,
        params: config.params,
        timeout: config.timeout,
      } : null,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: this.sanitizeHeaders(error.response.headers),
        data: error.response.data,
      } : null,
      timestamp: new Date().toISOString(),
    });
  }
}

// 创建默认的 HTTP 客户端实例
const defaultHttpClient = new HttpClient();

export {
  HttpClient,
  createAxiosInstance,
  executeWithRetry,
  getExponentialBackoffDelay,
  shouldNotRetry,
  defaultHttpClient,
};