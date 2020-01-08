'use strict';
/**
 * 负责管理子进程的运行以及维护各种可能出现的问题
 */
const { fork } = require('child_process');
const path = require('path');
const { WORKER_STATE, MESSAGE } = require('./constant');
const { getObj } = require('./utils');


class Worker {

  constructor() {
    this.state = WORKER_STATE.NONE;
    this.subProcess = null;
    // 脚本任务
    this.script = null;
    this.queue = [];
    // 函数调用栈
    this.funcStack = [];
    this.stackScript = null;

    this.createWorker();
  }

  // 创建工作线程
  createWorker() {
    const runnerFile = path.resolve(__dirname, './runner.js');
    this.subProcess = fork(runnerFile);
    this.state = WORKER_STATE.IDLE;

    this.subProcess.on('message', async m => {
      if (m.type === MESSAGE.UNKNOWN_ERROR) {
        // TODO 清理woker，重新创建
        this.killWorker();
      }
      // 正常运行结束
      if (m.type === MESSAGE.RUN_END) {
        if (this.stackScript) {
          this.stackScript.resolve(m.value);
          this.stackScript = null;
        } else {
          this.script.resolve(m.value);
          this.resetWorker();
        }
      }
      // 运行出错
      if (m.type === MESSAGE.RUN_ERROR) {
        if (this.stackScript) {
          this.stackScript.reject(m.value);
          this.stackScript = null;
        } else {
          this.script.reject(m.value);
          this.resetWorker();
        }
      }
      // 调用函数
      if (m.type === MESSAGE.CALL_REMOTE_FN) {
        const { args, callId, name } = m.value;
        const { context } = this.script;
        const fn = getObj(context, name);
        if (!fn) {
          throw new Error(`function ${name} not found`);
        }
        try {
          const result = await fn.apply(null, args); // 这里的error怎么处理
          this.subProcess.send({ type: MESSAGE.CALL_REMOTE_FN, value: { callId, result } });
        } catch (error) {
          this.subProcess.send({ type: MESSAGE.CALL_REMOTE_FN, value: { callId, error: error.message } });
        }
      }
    });
  }

  killWorker() {
    this.subProcess.kill();
    this.subProcess = null;
    this.resetStack();
    this.state = WORKER_STATE.NONE;
    this.createWorker();
    this.consume();
  }

  resetWorker() {
    this.script.stop();
    this.resetStack();
    this.script = null;
    this.state = WORKER_STATE.IDLE;
    this.consume();
  }

  consume() {
    if (this.state === WORKER_STATE.IDLE) {
      // 执行队列中的任务
      const nextScript = this.queue.shift();
      if (nextScript) {
        this.runScript(nextScript);
      }
    }
  }

  // 重置 funcStack 防止内存泄露
  resetStack() {
    this.stackScript = null;
    if (this.funcStack) {
      for (const script of this.funcStack) {
        script.reject('run out').catch()
      }
    }
  }

  //
  runScript(script) {
    this.script = script;
    this.state = WORKER_STATE.BUSY;
    this.subProcess.send({ type: MESSAGE.RUN_CODE, value: script });
    this.script.start(() => {
      // 杀死子进程
      script.reject('running timeout, maybe the code is infinite loop');
      this.killWorker();
    });
  }

  // 运行函数栈
  runFuncStack() {
    const stackScript = this.funcStack.pop();
    this.stackScript = stackScript;
    this.subProcess.send({ type: MESSAGE.RUN_CODE, value: stackScript });
  }


  // 运行脚本
  async execute(script, stack) {
    if (this.state === WORKER_STATE.IDLE && !stack) {
      this.runScript(script);
    } else if (this.state === WORKER_STATE.BUSY) {
      if (stack) {
        this.funcStack.push(script);
        this.runFuncStack();
      } else {
        this.queue.push(script);
      }
    }
  }
}


module.exports = Worker;
