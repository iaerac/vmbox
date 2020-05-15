'use strict';
/**
 * 负责管理子进程的运行以及维护各种可能出现的问题
 */
const { fork } = require('child_process');
const path = require('path');
const { WORKER_STATE, MESSAGE } = require('./constant');
const { getObj } = require('./utils');


class Worker {

  constructor(max_worker_num) {
    // 脚本任务
    this.queue = [];

    //进程池
    this.max_worker_num = max_worker_num;
    this.worker_pool = [];
    this.createWorkers();
  }

  createWorkers() {
    while (this.worker_pool.length < this.max_worker_num) {
      const worker = this.createWorker();
      this.worker_pool.push(worker);
      console.log(`进程总数: ${this.max_worker_num}, 当前: ${this.worker_pool.length}, 最新启动进程：${worker.subProcess.pid}`);
    }
  }

  // 获取空闲的worker
  getIdleWorker() {
    for (const worker of this.worker_pool) {
      if (worker.state === WORKER_STATE.IDLE) {
        return worker
      }
    }

    return null;
  }

  // 创建工作线程
  createWorker() {
    const worker = {};
    const runnerFile = path.resolve(__dirname, './runner.js');
    worker.subProcess = fork(runnerFile);
    worker.state = WORKER_STATE.IDLE;

    worker.subProcess.on('message', async m => {
      if (m.type === MESSAGE.UNKNOWN_ERROR) {
        this.killWorker(worker);
      }
      // 正常运行结束
      if (m.type === MESSAGE.RUN_END) {
        worker.script.resolve(m.value);
        this.resetWorker(worker);
      }
      // 运行出错
      if (m.type === MESSAGE.RUN_ERROR) {
        worker.script.reject(m.value);
        this.resetWorker(worker);
      }
      // 调用函数
      if (m.type === MESSAGE.CALL_REMOTE_FN) {
        const { args, callId, name } = m.value;
        const { context } = worker.script;
        const fn = getObj(context, name);
        if (!fn) {
          throw new Error(`function ${name} not found`);
        }
        try {
          const result = await fn.apply(null, args); // 这里的error怎么处理
          worker.subProcess.send({ type: MESSAGE.CALL_REMOTE_FN, value: { callId, result } });
        } catch (error) {
          worker.subProcess.send({ type: MESSAGE.CALL_REMOTE_FN, value: { callId, error: error.message } });
        }
      }
    });

    return worker;
  }

  killWorker(worker) {
    worker.subProcess.kill();
    // get worker index
    const index = this.worker_pool.indexOf(worker);
    this.worker_pool.splice(index, 1);
    this.createWorkers();
    this.consume();
  }

  resetWorker(worker) {
    worker.script.stop();
    worker.script = null;
    worker.state = WORKER_STATE.IDLE;
    this.consume();
  }

  consume() {
    const idleWorker = this.getIdleWorker();
    if (idleWorker) {
      // 执行队列中的任务
      const nextScript = this.queue.shift();
      if (nextScript) {
        this.runScript(idleWorker, nextScript);
      }
    }
  }


  //
  runScript(worker, script) {
    worker.state = WORKER_STATE.BUSY;
    worker.subProcess.send({ type: MESSAGE.RUN_CODE, value: script });
    worker.script = script;
    script.start(() => {
      // 杀死子进程
      script.reject('running timeout, maybe the code is infinite loop');
      this.killWorker(worker);
    });
  }


  // 运行脚本
  async execute(script) {
    const idleWorker = this.getIdleWorker();
    if (idleWorker) {
      this.runScript(idleWorker, script);
    } else if (this.state === WORKER_STATE.BUSY) {
      this.queue.push(script);
    }
  }
}


module.exports = Worker;
