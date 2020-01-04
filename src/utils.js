'use strict';
const { CALL_FN_IPC } = require('./constant');
const utils = {

  uniqueId() {
    return Math.random().toString(36).slice(2); // 截取小数点后的字符串
  },
  flatJson(obj, root = '', result = {}) {
    for (const key in obj) {
      const value = obj[key];
      const nameArr = root ? [root, key] : [key];
      const name = nameArr.join('.');
      if (typeof value === 'object') {
        this.flatJson(value, name, result);
      } else {
        result[name] = value;
      }
    }
    return result;
  },
  encodeSandbox(sandbox) {
    const params = {};
    const flatSandbox = utils.flatJson(sandbox);
    for (const key in flatSandbox) {
      if (typeof utils.getObj(sandbox, key) === 'function') {
        params[key] = CALL_FN_IPC;
      } else {
        params[key] = sandbox[key];
      }
    }
    return params;
  },
  setObj(obj, path, value) {
    const pathArr = path.split('.');
    const pathPre = pathArr.slice(0, -1);
    const lastPath = pathArr.slice(-1)[0];
    let p = obj;
    for (const key of pathPre) {
      p = p[key];
    }
    p[lastPath] = value;
    return obj;
  },
  getObj(obj, path) {
    const pathArr = path.split('.');
    let p = obj;
    for (const key of pathArr) {
      if (p[key]) {
        p = p[key];
      } else {
        return p[key];
      }
    }

    return p;
  },


};

module.exports = utils;
