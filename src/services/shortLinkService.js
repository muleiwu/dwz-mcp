/**
 * 短链接远程服务模块
 * 封装所有与远程短网址服务器交互的业务逻辑
 */

import { defaultHttpClient } from './httpClient.js';
import { getApiUrl, validateConfig, getLogger } from '../config/remoteConfig.js';
import { validateOrThrow, normalizeUrl, normalizePaginationParams } from '../utils/validation.js';
import { ErrorHandler, NotFoundError, BusinessError } from '../utils/errorHandler.js';

const logger = getLogger();

/**
 * 短链接服务类
 */
export class ShortLinkService {
  constructor() {
    this.httpClient = defaultHttpClient;
    this.validateServiceConfig();
  }

  /**
   * 验证服务配置
   */
  validateServiceConfig() {
    if (!validateConfig()) {
      throw new BusinessError('短链接服务配置无效，请检查环境变量');
    }
    logger.info('短链接服务配置验证通过');
  }

  /**
   * 处理远程 API 响应
   * @param {Object} response - 远程 API 响应
   * @param {string} operation - 操作名称
   * @returns {any} 处理后的数据
   */
  handleApiResponse(response, operation) {
    logger.debug(`${operation} API 响应:`, response);

    // 检查响应格式
    if (!response || typeof response !== 'object') {
      throw new BusinessError(`${operation}: 服务器响应格式错误`);
    }

    // 检查业务状态码
    if (response.code !== 0) {
      const message = response.message || `${operation} 操作失败`;
      throw new BusinessError(message, this.mapApiErrorCode(response.code));
    }

    // 检查数据是否存在
    if (response.data === null || response.data === undefined) {
      logger.warn(`${operation}: 响应数据为空`);
      return null;
    }

    return response.data;
  }

  /**
   * 映射 API 错误码到内部错误码
   * @param {number} apiCode - API 错误码
   * @returns {string} 内部错误码
   */
  mapApiErrorCode(apiCode) {
    const errorCodeMap = {
      400: 'VALIDATION_ERROR',
      401: 'AUTHENTICATION_ERROR',
      403: 'AUTHORIZATION_ERROR',
      404: 'RESOURCE_NOT_FOUND',
      409: 'RESOURCE_ALREADY_EXISTS',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return errorCodeMap[apiCode] || 'UNKNOWN_ERROR';
  }

  /**
   * 创建短链接
   * @param {Object} params - 创建参数
   * @returns {Promise<Object>} 创建结果
   */
  async createShortUrl(params) {
    try {
      // 验证参数
      const validatedParams = validateOrThrow('createShortUrl', params);

      // 标准化 URL
      validatedParams.original_url = normalizeUrl(validatedParams.original_url);

      logger.info('开始创建短链接:', {
        original_url: validatedParams.original_url,
        domain: validatedParams.domain,
        custom_code: validatedParams.custom_code,
      });

      // 发送请求
      const response = await this.httpClient.post(
        getApiUrl('/shortlinks'),
        validatedParams
      );

      // 处理响应
      const result = this.handleApiResponse(response, '创建短链接');

      logger.info('短链接创建成功:', {
        id: result.id,
        short_code: result.short_code,
        short_url: result.short_url,
      });

      return result;

    } catch (error) {
      logger.error('创建短链接失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 获取短链接信息
   * @param {number} id - 短链接 ID
   * @returns {Promise<Object>} 短链接信息
   */
  async getUrlInfo(id) {
    try {
      // 验证参数
      validateOrThrow('getUrlInfo', { id });

      logger.info('获取短链接信息:', { id });

      // 发送请求
      const response = await this.httpClient.get(
        getApiUrl(`/shortlinks/${id}`)
      );

      // 处理响应
      const result = this.handleApiResponse(response, '获取短链接信息');

      logger.info('获取短链接信息成功:', {
        id: result.id,
        short_code: result.short_code,
        original_url: result.original_url,
      });

      return result;

    } catch (error) {
      logger.error('获取短链接信息失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 更新短链接
   * @param {Object} params - 更新参数
   * @returns {Promise<Object>} 更新结果
   */
  async updateShortUrl(params) {
    try {
      // 验证参数
      const validatedParams = validateOrThrow('updateShortUrl', params);

      // 如果提供了 URL，进行标准化
      if (validatedParams.original_url) {
        validatedParams.original_url = normalizeUrl(validatedParams.original_url);
      }

      logger.info('开始更新短链接:', {
        id: validatedParams.id,
        fields: Object.keys(validatedParams).filter(key => key !== 'id'),
      });

      // 发送请求
      const response = await this.httpClient.put(
        getApiUrl(`/shortlinks/${validatedParams.id}`),
        validatedParams
      );

      // 处理响应
      const result = this.handleApiResponse(response, '更新短链接');

      logger.info('短链接更新成功:', {
        id: result.id,
        short_code: result.short_code,
      });

      return result;

    } catch (error) {
      logger.error('更新短链接失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 删除短链接
   * @param {number} id - 短链接 ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteShortUrl(id) {
    try {
      // 验证参数
      validateOrThrow('deleteShortUrl', { id });

      logger.info('开始删除短链接:', { id });

      // 发送请求
      const response = await this.httpClient.delete(
        getApiUrl(`/shortlinks/${id}`)
      );

      // 处理响应
      const result = this.handleApiResponse(response, '删除短链接');

      logger.info('短链接删除成功:', { id });

      return result;

    } catch (error) {
      logger.error('删除短链接失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 批量创建短链接
   * @param {Object} params - 批量创建参数
   * @returns {Promise<Object>} 批量创建结果
   */
  async batchCreateShortUrls(params) {
    try {
      // 验证参数
      const validatedParams = validateOrThrow('batchCreateShortUrls', params);

      // 标准化所有 URL
      const normalizedUrls = validatedParams.urls.map(url => normalizeUrl(url));

      logger.info('开始批量创建短链接:', {
        url_count: normalizedUrls.length,
        domain: validatedParams.domain,
      });

      // 发送请求
      const response = await this.httpClient.post(
        getApiUrl('/shortlinks/batch'),
        {
          ...validatedParams,
          urls: normalizedUrls,
        }
      );

      // 处理响应
      const result = this.handleApiResponse(response, '批量创建短链接');

      logger.info('批量创建短链接完成:', {
        success_count: result.success?.length || 0,
        failed_count: result.failed?.length || 0,
      });

      return result;

    } catch (error) {
      logger.error('批量创建短链接失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 获取短链接统计信息
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 统计信息
   */
  async getUrlStatistics(params) {
    try {
      // 验证参数
      const validatedParams = validateOrThrow('getUrlStatistics', params);

      logger.info('获取短链接统计信息:', {
        id: validatedParams.id,
        days: validatedParams.days,
      });

      // 构建查询参数
      const queryParams = { days: validatedParams.days };

      // 发送请求
      const response = await this.httpClient.get(
        getApiUrl(`/shortlinks/${validatedParams.id}/statistics`),
        queryParams
      );

      // 处理响应
      const result = this.handleApiResponse(response, '获取统计信息');

      logger.info('获取统计信息成功:', {
        id: validatedParams.id,
        total_clicks: result.total_clicks,
        days: validatedParams.days,
      });

      return result;

    } catch (error) {
      logger.error('获取统计信息失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 列出短链接
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 短链接列表
   */
  async listShortUrls(params = {}) {
    try {
      // 验证参数
      const validatedParams = validateOrThrow('listShortUrls', params);

      // 标准化分页参数
      const paginationParams = normalizePaginationParams(validatedParams);

      logger.info('列出短链接:', paginationParams);

      // 构建查询参数
      const queryParams = {
        page: paginationParams.page,
        page_size: paginationParams.page_size,
      };

      // 添加可选参数
      if (validatedParams.domain) {
        queryParams.domain = validatedParams.domain;
      }
      if (validatedParams.keyword) {
        queryParams.keyword = validatedParams.keyword;
      }

      // 发送请求
      const response = await this.httpClient.get(
        getApiUrl('/short_links'),
        queryParams
      );

      // 处理响应
      const result = this.handleApiResponse(response, '列出短链接');

      logger.info('获取短链接列表成功:', {
        total: result.total,
        page: result.page,
        size: result.size,
        count: result.list?.length || 0,
      });

      return result;

    } catch (error) {
      logger.error('列出短链接失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 预览短链接
   * @param {string} code - 短链接代码
   * @returns {Promise<Object>} 预览信息
   */
  async previewShortUrl(code) {
    try {
      if (!code || typeof code !== 'string') {
        throw new BusinessError('短链接代码不能为空');
      }

      logger.info('预览短链接:', { code });

      // 发送请求
      const response = await this.httpClient.get(
        getApiUrl(`/preview/${code}`)
      );

      // 处理响应
      const result = this.handleApiResponse(response, '预览短链接');

      logger.info('预览短链接成功:', {
        short_code: result.short_code,
        original_url: result.original_url,
      });

      return result;

    } catch (error) {
      logger.error('预览短链接失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 检查短链接是否存在
   * @param {number} id - 短链接 ID
   * @returns {Promise<boolean>} 是否存在
   */
  async checkShortUrlExists(id) {
    try {
      await this.getUrlInfo(id);
      return true;
    } catch (error) {
      if (error.code === 'RESOURCE_NOT_FOUND') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 获取域名列表
   * @returns {Promise<Object>} 域名列表
   */
  async listDomains() {
    try {
      logger.info('获取域名列表');

      // 发送请求
      const response = await this.httpClient.get(
        getApiUrl('/domains')
      );

      // 处理响应
      const result = this.handleApiResponse(response, '获取域名列表');

      logger.info('获取域名列表成功:', {
        count: result.list?.length || 0,
      });

      return result;

    } catch (error) {
      logger.error('获取域名列表失败:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * 获取服务状态信息
   * @returns {Promise<Object>} 服务状态
   */
  async getServiceStatus() {
    try {
      logger.info('检查服务状态');

      // 尝试获取第一页的数据来检查服务是否可用
      await this.listShortUrls({ page: 1, page_size: 1 });

      return {
        status: 'healthy',
        message: '服务运行正常',
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      logger.error('服务状态检查失败:', error);

      return {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString(),
        error_code: error.code,
      };
    }
  }
}

// 创建默认的服务实例
export const defaultShortLinkService = new ShortLinkService();

export default defaultShortLinkService;