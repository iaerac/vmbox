# vmbox 
   ![npm version](https://img.shields.io/npm/v/vmbox.svg?style=flat)

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
  * functions call each other (inter-function calls with the help of context)
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
|stack | boolean | false | false | call other functions within the function and record the function call stack|

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

**advanced usage**

There are many things you can do with the help of a function execution context. Here is a method that calls other functions from inside the function.

```javascript
const VMBox = require('vmbox');
const vmBox = new VMBox({
  timeout: 100,
  asyncTimeout: 500
});

const fnGroup = {
  sum: `async function main({params, fn}){
    const {a, b} = params;
    return a + b
  }`,
  caller: `async function main({params, fn}){
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

const code = fnGroup.caller;
try {
  const res = await run(code, context);
  console.log(res); // 打印30
} catch (error) {
  console.log(error);
}
```
If the functions call each other, a closed loop of calls may be formed. If the running is not completed for 500ms, the execution child process will be killed and a new child process will be started.


## contributing
This repository is used to build faas service. It is currently used in online projects. If you find a problem during use, you can submit an issue and we will fix it as soon as possible. If you have good suggestions for modification, you can submit a pull request, including issue and solution.
