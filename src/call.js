'use strict';
const { uniqueId } = require('./utils');

class Call {
  constructor() {
    this.id = uniqueId();
    this.defer = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }


}

module.exports = Call;

