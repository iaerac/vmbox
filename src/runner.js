
'use strict';
const { MESSAGE, CALL_FN_IPC } = require('./constant');
const { VM } = require('vm2');
const Call = require('./call');
const { setObj } = require('./utils');

const map = new Map();

function convertToSandbox(params, context) {
  for (const key in params) {
    if (params[key] === CALL_FN_IPC) {
      setObj(context, key, (...args) => {
        const call = new Call();
        map.set(call.id, call);
        process.send({ type: MESSAGE.CALL_REMOTE_FN, value: { args, callId: call.id, name: key } });
        return call.defer;
      });
    } else {
      setObj(context, key, params[key]);
    }
  }
  return context;
}

// 运行脚本
async function run(script) {
  const { code, timeout, params, context } = script;
  try {
    const sandbox = convertToSandbox(params, context);
    const vm = new VM({ timeout, sandbox });
    const result = await vm.run(code);
    process.send({
      type: MESSAGE.RUN_END,
      value: result,
    });
  } catch (error) {
    process.send({
      type: MESSAGE.RUN_ERROR,
      value: error.message || error,
    });
  }
}


process.on('message', async m => {
  if (m.type === MESSAGE.RUN_CODE) {
    await run(m.value);
  }
  if (m.type === MESSAGE.CALL_REMOTE_FN) {
    const { callId, result, error } = m.value;
    const call = map.get(callId);
    map.delete(callId); // 取出来立即删除
    if (call) {
      if (error) {
        call.reject(error);
      } else {
        call.resolve(result);
      }
    } else {
      process.send({
        type: MESSAGE.RUN_ERROR,
        value: new Error('remote call function error'),
      });
    }
  }
});


process.on('uncaughtException', err => {
  process.send({
    type: MESSAGE.UNKNOWN_ERROR,
    value: err,
  });
});

process.on('exit', code => {
  process.send({
    type: MESSAGE.UNKNOWN_ERROR,
    value: `self exit ${code}`,
  });
});
