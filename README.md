# vmbox 
   [![npm version](https://badge.fury.io/js/vmbox.svg)](https://badge.fury.io/js/vmbox)
   [![npm download](https://img.shields.io/npm/dt/vmbox.svg)]()

  [中文版](./README.zh.md)

  vmbox is a `security sandbox` born to solve the insecureness of node's vm module. It can be used to run untrusted js code

  Node provides a vm module to run js code, but it is not safe and cannot be used to run untrusted code.
  > The vm module is not a security mechanism. Do not use it to run untrusted code
  
  The community has provided vm2 with the ability to run unsafe code and to defend against all known attack methods. But the problem of [asynchronous endless loop] (https://github.com/patriksimek/vm2/issues/180) still exists.

  vmbox uses child process isolation and encapsulates [vm2](https://github.com/patriksimek/vm2) to solve the problem of asynchronous endless loop.

## Documentation
  - [Feature](#Feature)
  - [Installation](#Installation)
  - [Quickstart](#Quickstart)
  - [vm2](#vm2)
  - [usage](#usage)
  - [contributing](#contributing)

## Feature

  * forced exit in an endless loop (kill child process in an endless loop)
  * cross-process function call (using IPC cross-process call function)
  * internal task queue
  * process autonomy (killed since startup)
  * return promise

## Installation

```
npm install vmbox --save
```

## Quickstart

```javascript
const VMBox = require('vmbox');
const vmBox = new VMBox({
  timeout: 100,
  asyncTimeout: 500
});

const fn = `a = 10`;
vmBox.run(fn).then(console.log)
// 打印10
```
`timeout` is the limit execution time for synchronous code, default 100ms  
`asyncTimeout`is the limit execution time for asynchronous code, default 500ms

## vm2

vm2 is very powerful, vmbox encapsulates the most basic functions of vm2, only supports context function injection, and does not support node built-in modules and custom modules.

```javascript
// innernal vm2 usage
const { VM } = require('vm2');
const vm = new VM({ timeout, sandbox });
const result = await vm.run(code);
```

## usage
The vmbox instance has only one `run` method, and the return value is a` promise`, receiving three parameters

| param name | type | required | default | introduction |
|---|---|---|---|---|
|code|string| true | - | js code to run|
|context| object | false | {} | function execution context |
|options | object | false | { timeout: 500 } | limit function running time |

If the code runs incorrectly, an exception will be thrown by Promise.reject (error), and the exception needs to be caught

**basic usage**

```javascript
const VMBox = require('vmbox');
const vmBox = new VMBox({
  timeout: 100,
  asyncTimeout: 500
});

const context = {
  sum(a, b){
    return a + b;
  }
}

const fn = `sum(2, 3)`

vmBox.run(fn).then(console.log)
// log 5
```

**async infinite loop**

```javascript
const VMBox = require('vmbox');
const vmBox = new VMBox({
  workerNum: 1
});

const context = {
  getSum: async (a, b) => {
    // just display async operation
    return Promise.resolve(a +b);
  }
}

const fn = `(async function main(sum){
  var total = await getSum(1, 3)
  while(1){
    // doSomething
  }  
  return total
})()`

vmBox.run(fn, context, { timeout: 500 }).then(console.log)
// log running timeout, maybe the code is infinite loop
```

## contributing
If you find a problem during use, you can submit an issue and we will fix it as soon as possible. If you have good suggestions for modification, you can submit a pull request, including issue and solution.
