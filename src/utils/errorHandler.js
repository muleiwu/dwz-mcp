/**
 * 错误处理工具模块
 * 统一处理各种类型的错误，并提供标准化的错误响应格式
 */

import { getLogger } from '../config/remoteConfig.js';

const logger = getLogger();

/**
 * 错误代码枚举
 */
export const ErrorCodes = {
  // 网络相关错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // 认证相关错误
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',

  // 参数相关错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  INVALID_PARAMETER: 'INVALID_PARAMETER',

  // 业务逻辑错误
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // 服务器错误
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // 配置错误
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_CONFIG: 'MISSING_CONFIG',

  // 未知错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * 错误类别到 HTTP 状态码的映射
 */
const ERROR_STATUS_MAP = {
  [ErrorCodes.NETWORK_ERROR]: 503,
  [ErrorCodes.TIMEOUT_ERROR]: 408,
  [ErrorCodes.CONNECTION_ERROR]: 503,
  [ErrorCodes.AUTHENTICATION_ERROR]: 401,
  [ErrorCodes.AUTHORIZATION_ERROR]: 403,
  [ErrorCodes.INVALID_API_KEY]: 401,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.MISSING_PARAMETER]: 400,
  [ErrorCodes.INVALID_PARAMETER]: 400,
  [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
  [ErrorCodes.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCodes.OPERATION_NOT_ALLOWED]: 403,
  [ErrorCodes.QUOTA_EXCEEDED]: 429,
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.CONFIGURATION_ERROR]: 500,
  [ErrorCodes.MISSING_CONFIG]: 500,
  [ErrorCodes.UNKNOWN_ERROR]: 500,
};

/**
 * 自定义错误类
 */
export class CustomError extends Error {
  constructor(message, code = ErrorCodes.UNKNOWN_ERROR, statusCode = 500, details = null) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // 确保堆栈跟踪正确
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 转换为 JSON 格式
   * @returns {Object} JSON 对象
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends CustomError {
  constructor(message, details = null) {
    super(message, ErrorCodes.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends CustomError {
  constructor(message, originalError = null) {
    super(message, ErrorCodes.NETWORK_ERROR, 503, { originalError: originalError?.message });
    this.name = 'NetworkError';
  }
}

/**
 * 认证错误类
 */
export class AuthenticationError extends CustomError {
  constructor(message = '认证失败') {
    super(message, ErrorCodes.AUTHENTICATION_ERROR, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 资源未找到错误类
 */
export class NotFoundError extends CustomError {
  constructor(resource = '资源', id = null) {
    const message = id ? `${resource} (ID: ${id}) 未找到` : `${resource} 未找到`;
    super(message, ErrorCodes.RESOURCE_NOT_FOUND, 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

/**
 * 业务逻辑错误类
 */
export class BusinessError extends CustomError {
  constructor(message, code = ErrorCodes.OPERATION_NOT_ALLOWED) {
    super(message, code, ERROR_STATUS_MAP[code]);
    this.name = 'BusinessError';
  }
}

/**
 * 错误分析器
 * 根据不同的错误类型和来源，分析并返回标准化的错误信息
 */
export class ErrorAnalyzer {
  /**
   * 分析 HTTP 错误响应
   * @param {Object} error - HTTP 错误对象
   * @returns {CustomError} 标准化的错误对象
   */
  static analyzeHttpError(error) {
    if (!error.response) {
      // 网络连接错误
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new NetworkError('请求超时', error);
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return new NetworkError('无法连接到服务器', error);
      }
      return new NetworkError('网络连接失败', error);
    }

    const { status, data } = error.response;

    // 根据状态码确定错误类型
    switch (status) {
      case 400:
        return new ValidationError(
          data?.message || '请求参数错误',
          data?.details || null
        );
      case 401:
        return new AuthenticationError(data?.message || '未授权访问');
      case 403:
        return new BusinessError(
          data?.message || '操作被禁止',
          ErrorCodes.AUTHORIZATION_ERROR
        );
      case 404:
        return new NotFoundError('短网址', error.config?.params?.id);
      case 409:
        return new BusinessError(
          data?.message || '资源已存在',
          ErrorCodes.RESOURCE_ALREADY_EXISTS
        );
      case 429:
        return new BusinessError(
          data?.message || '请求频率过高',
          ErrorCodes.RATE_LIMIT_EXCEEDED
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new CustomError(
          data?.message || '服务器内部错误',
          ErrorCodes.INTERNAL_SERVER_ERROR,
          status
        );
      default:
        return new CustomError(
          data?.message || `HTTP ${status} 错误`,
          ErrorCodes.UNKNOWN_ERROR,
          status
        );
    }
  }

  /**
   * 分析验证错误
   * @param {Object} error - 验证错误对象
   * @returns {ValidationError} 验证错误对象
   */
  static analyzeValidationError(error) {
    const details = error.details?.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    })) || [];

    return new ValidationError(
      error.message || '参数验证失败',
      details
    );
  }

  /**
   * 分析配置错误
   * @param {Error} error - 配置错误对象
   * @returns {CustomError} 配置错误对象
   */
  static analyzeConfigError(error) {
    return new CustomError(
      `配置错误: ${error.message}`,
      ErrorCodes.CONFIGURATION_ERROR,
      500,
      { originalError: error.message }
    );
  }

  /**
   * 分析未知错误
   * @param {Error} error - 未知错误对象
   * @returns {CustomError} 未知错误对象
   */
  static analyzeUnknownError(error) {
    return new CustomError(
      `未知错误: ${error.message}`,
      ErrorCodes.UNKNOWN_ERROR,
      500,
      {
        originalError: error.message,
        stack: error.stack,
      }
    );
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 处理错误的主要方法
   * @param {Error} error - 原始错误对象
   * @returns {CustomError} 处理后的错误对象
   */
  static handle(error) {
    // 记录错误日志
    logger.error('处理错误:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // 根据错误类型进行不同的处理
    if (error.response) {
      // HTTP 响应错误
      return ErrorAnalyzer.analyzeHttpError(error);
    }

    if (error.isJoi) {
      // Joi 验证错误
      return ErrorAnalyzer.analyzeValidationError(error);
    }

    if (error.code === 'MISSING_CONFIG') {
      // 配置错误
      return ErrorAnalyzer.analyzeConfigError(error);
    }

    if (error instanceof CustomError) {
      // 已经是自定义错误，直接返回
      return error;
    }

    // 未知错误
    return ErrorAnalyzer.analyzeUnknownError(error);
  }

  /**
   * 创建 MCP 错误响应
   * @param {CustomError} error - 自定义错误对象
   * @returns {Object} MCP 错误响应格式
   */
  static createMcpErrorResponse(error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
      },
    };
  }

  /**
   * 创建成功响应
   * @param {any} data - 响应数据
   * @returns {Object} MCP 成功响应格式
   */
  static createSuccessResponse(data) {
    return {
      success: true,
      data,
    };
  }

  /**
   * 异步包装器，自动处理函数中的错误
   * @param {Function} fn - 要包装的异步函数
   * @returns {Function} 包装后的函数
   */
  static asyncWrapper(fn) {
    return async (...args) => {
      try {
        const result = await fn(...args);
        return ErrorHandler.createSuccessResponse(result);
      } catch (error) {
        const handledError = ErrorHandler.handle(error);
        return ErrorHandler.createMcpErrorResponse(handledError);
      }
    };
  }

  /**
   * 检查错误是否可重试
   * @param {CustomError} error - 错误对象
   * @returns {boolean} 是否可重试
   */
  static isRetryable(error) {
    const retryableCodes = [
      ErrorCodes.NETWORK_ERROR,
      ErrorCodes.TIMEOUT_ERROR,
      ErrorCodes.CONNECTION_ERROR,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      ErrorCodes.SERVICE_UNAVAILABLE,
    ];

    return retryableCodes.includes(error.code);
  }
}

/**
 * 快捷方法：创建验证错误
 */
export const createValidationError = (message, details) => new ValidationError(message, details);

/**
 * 快捷方法：创建网络错误
 */
export const createNetworkError = (message, originalError) => new NetworkError(message, originalError);

/**
 * 快捷方法：创建认证错误
 */
export const createAuthenticationError = (message) => new AuthenticationError(message);

/**
 * 快捷方法：创建未找到错误
 */
export const createNotFoundError = (resource, id) => new NotFoundError(resource, id);

/**
 * 快捷方法：创建业务错误
 */
export const createBusinessError = (message, code) => new BusinessError(message, code);

export default ErrorHandler;