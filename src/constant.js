'use strict';
module.exports = {
  WORKER_STATE: {
    NONE: 'NONE', // 没有初始化的worker进程
    IDLE: 'IDLE', // 进程空闲可以使用
    BUSY: 'BUSY', // 进程正在工作，需要等待
    ERROR: 'ERROR', // 进程出错需要kill
  },

  MESSAGE: {
    RUN_CODE: 'RUN_CODE', // 运行代码
    RUN_END: 'RUN_END', // 运行结束
    RUN_ERROR: 'RUN_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR', // 未知错误，干掉
    CALL_REMOTE_FN: 'CALL_REMOTE_FN',
  },
  CALL_FN_IPC: 'CALL_FN_IPC',

};
