'use strict';
/**
 * 简单实现单进程， 进程池中只有一个worker
 * 这是一个单例比较合适
 */
const Worker = require('./worker');
const Script = require('./script');

class VMBox {

  constructor(options = {}) {
    this.worker = new Worker();
    this.asyncTimeout = options.asyncTimeout || 500;
    this.timeout = options.timeout || 100;
  }

  // 运行函数
  async run(code, context = {}, stack = false) {
    // 将脚本交给worker运行
    const script = new Script({ code, asyncTimeout: this.asyncTimeout, context, timeout: this.timeout });
    this.worker.execute(script, stack);
    return script.defer;
  }
}

module.exports = VMBox;
