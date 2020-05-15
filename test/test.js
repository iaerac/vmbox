'use strict';

const VMBox = require('../index.js');
const assert = require('assert');

const vmBox = new VMBox({
  workerNum: 1
});


describe('vmBox', function () {

  it('normal test', async () => {
    const code = `a = 10;`
    const res = await vmBox.run(code);
    return assert.equal(10, res);
  });

  it('context test', async () => {
    const context = {
      sum(a, b) {
        return a + b;
      }
    }

    const code = `sum(2,3)`
    const res = await vmBox.run(code, context);
    return assert.equal(res, 5);
  })

  it('infinite loop', async () => {
    const context = {
      sum(a, b) {
        return a + b;
      }
    }
    const code = `async function main(){
      let res = await sum(2, 3);
      while(1){}
      return res;
    };main()`;
    try {
      await vmBox.run(code, context);
    } catch (error) {
      return assert.equal('running timeout, maybe the code is infinite loop', error);
    }
    return assert.ok(false);
  });

  it('func call', async () => {
    const fnGroup = {
      sum: `async function main({params, fn}){
        const {a, b} = params;
        return a + b
      }`,
      A: `async function main({params, fn}){
        return await fn.call('sum', params);
      }`
    };

    async function run(code, context, stack = false) {
      const runCode = code + `;\n(async () => { return await main({params, fn}); })()`
      return vmBox.run(runCode, context, stack);
    }

    const fn = {
      call: (name, params) => {
        const code = fnGroup[name];
        if (code) {
          return run(code, { params, fn }, true);
        } else {
          return null;
        }
      }
    }

    const context = {
      fn,
      params: {
        a: 10,
        b: 20
      }
    }

    const code = fnGroup.A;
    try {
      const res = await run(code, context);
      return assert.equal(res, 30);
    } catch (error) {
      return assert.ok(false);
    }
  })


  it('infinite func call loop 2', async () => {
    const fnGroup = {
      sum: `async function main({params, fn}){
        return await fn.call('A', params)
      }`,
      A: `async function main({params, fn}){
        return await fn.call('sum', params);
      }`
    };

    async function run(code, context, stack = false) {
      const runCode = code + `;\n(async () => { return await main({params, fn}); })()`
      return vmBox.run(runCode, context, stack);
    }

    const fn = {
      call: (name, params) => {
        const code = fnGroup[name];
        if (code) {
          return run(code, { params, fn }, true);
        } else {
          return null;
        }
      }
    }

    const context = {
      fn,
      params: {
        a: 10,
        b: 20
      }
    }

    const code = fnGroup.A;
    try {
      await run(code, context);
    } catch (error) {
      return assert.equal('running timeout, maybe the code is infinite loop', error);
    }
    return assert.ok(false);
  })

  it('normal test2', async () => {
    const code = `5+ 5`
    const res = await vmBox.run(code);
    return assert.equal(10, res);
  });

  it('normal test3', async () => {
    const code = `5+ 6`
    const res = await vmBox.run(code);
    return assert.equal(11, res);
  });

  it('end', async () => {
    process.exit();
  })

});

