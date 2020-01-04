'use strict';

const { uniqueId, encodeSandbox } = require('./utils');

class Script {

  constructor({ code, context = {}, asyncTimeout = 500, timeout = 100 }) {
    this.id = uniqueId();
    this.code = code;
    this.context = context; // 仅仅保留，通过代理完成
    this.params = encodeSandbox(context);
    this.asyncTimeout = asyncTimeout;
    this.timeout = timeout;
    this.defer = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  start(fn) {
    this.timer = setTimeout(fn, this.asyncTimeout);
    return this;
  }

  stop() {
    clearTimeout(this.timer);
    return this;
  }

  toJSON() {
    return this;
  }
}


module.exports = Script;
