'use strict';
/**
 * 简单实现单进程， 进程池中只有一个worker
 * 这是一个单例比较合适
 */
const Worker = require('./worker');
const Script = require('./script');

class VMBox {

  constructor(options = {}) {
    this.worker = new Worker(options.workerNum || require('os').cpus() - 1);
  }

  // 运行函数
  async run(code, context = {}, options) {
    // 将脚本交给worker运行
    const { timeout = 500 } = options;
    const script = new Script({ code, asyncTimeout: timeout, context, timeout });
    this.worker.execute(script);
    return script.defer;
  }
}

module.exports = VMBox;
