#!/usr/bin/env node

/**
 * MCP 短网址客户端入口文件
 * 启动 MCP 服务器，为 AI 助手提供短网址管理功能
 */

import { createAndStartServer } from './mcp/server.js';
import { getLogger, validateConfig, getConfigForDebug } from './config/remoteConfig.js';

const logger = getLogger();

/**
 * 主函数
 */
async function main() {
  console.log('🚀 启动 Mliev 短网址 MCP 客户端...\n');

  try {
    // 显示配置信息（不包含敏感信息）
    console.log('📋 配置信息:');
    const config = getConfigForDebug();
    Object.entries(config).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');

    // 验证配置
    if (!validateConfig()) {
      console.error('❌ 配置验证失败，请检查环境变量');
      process.exit(1);
    }

    console.log('✅ 配置验证通过\n');

    // 启动服务器
    await createAndStartServer();

  } catch (error) {
    logger.error('启动失败:', error);
    console.error(`❌ 启动失败: ${error.message}`);

    if (process.env.NODE_ENV === 'development') {
      console.error('详细错误信息:', error);
    }

    process.exit(1);
  }
}

// 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n👋 收到退出信号，正在关闭...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 收到终止信号，正在关闭...');
  process.exit(0);
});

// 启动应用
main();