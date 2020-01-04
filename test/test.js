'use strict';

const VMBox = require('../index.js');
const assert = require('assert');

const vmBox = new VMBox({
  asyncTimeout: 500,
  timeout: 100
});


describe('vmBox', function () {

  it('normal test', async () => {
    const fn = `a = 10;`
    const res = await vmBox.run(fn);
    return assert.equal(10, res);
  });

  it('context test', async () => {
    const context = {
      sum(a, b) {
        return a + b;
      }
    }

    const fn = `sum(2,3)`
    const res = await vmBox.run(fn, context);
    return assert.equal(res, 5);
  })

  it('infinite loop', async () => {
    const context = {
      sum(a, b) {
        return a + b;
      }
    }
    const fn = `async function main(){
      let res = await sum(2, 3);
      while(1){}
      return res;
    };main()`;
    try {
      await vmBox.run(fn, context);
    } catch (error) {
      return assert.equal('running timeout, maybe the code is infinite loop', error);
    }
    return assert.ok(false);
  });

});

