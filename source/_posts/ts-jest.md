---
title: Jest测试TypeScript代码实践
comment: false
date: 2018-08-25 16:33:12
categories: Frontend
tags:
---

> 在软件开发中，我们通常通过单元测试（Unit Test, UT）来确保编写的代码符合软件需求，UT也往往作为自动化集成的一部分存在于软件工程中。说来惭愧，笔者在过去的工作中没有写过UT，最近主动接受了为项目做UT的任务，以弥补这方面的经验不足。本文主要介绍使用Jest对TypeScript项目做UT的一些实践。

<!--more-->

## Jest

[Jest](https://jestjs.io/)是一个优秀的JS代码测试框架，它能够对几乎所有的JS代码进行测试，尤其是`React`(毕竟都是FB爸爸的亲儿子)。

选择Jest来做UT主要是因为它具有以下几个特点：
- 开箱即用，几乎零配置集成到项目中；
- 测试运行速度快，反馈及时；
- 丰富的mock接口，可以mock模块、类、同步代码、异步代码等几乎所有常见的测试场景。

更多关于Jest的介绍及其API文档请参阅[官方文档](https://jestjs.io/)。下面直接进入正题。

## 准备工作

1. 安装jest依赖，这里需要额外安装`ts-jest`和`@types/jest`两个依赖包来支持TS。
```js
yarn add --dev jest ts-jest @types/jest
```

2. 在项目根目录添加`jest.config.js`文件，作为jest的配置文件，jest会根据该文件中的配置来执行测试任务，如指定测试文件所在的目录、是否需要收集覆盖率信息等。配置文件一般长这样：
```js
module.exports = {
  transform: {'^.+\\.tsx?$': 'ts-jest'},
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).(js|ts)?(x)'],
  testPathIgnorePatterns: ['/node_modules/', 'lib/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  bail: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/*.ts'],
  coverageDirectory: '__tests__/coverage/'
}
```

3. 设置test任务执行入口 —— 在`package.json`中添加如下命令，便可以通过`yarn test`执行测试任务。
```json
"scripts": {
  "test": "jest"
}
```

完成上述准备工作后，我们就可以愉快地开始写test case了。

## Test case

为了便于文件的组织管理，我们将所有的包含test case的文件都放在`__tests__`文件夹下。

一个典型的测试文件（以`index.spec.ts`为例）应该长成这样：
```typescript
describe('Test index', () => {
  it('test case 1', () => {
    const tmp = '123';
    expect(tmp).toBe('123);
  });
  it('test case 2', () => {
    const tmp = '456';
    expect(tmp).toBe('456);
  });
  // ...
})
```
其中`describe`表示一个测试集，每个`it`表示一个test case。`expect`语句用于断言该条测试是否通过，一个test case中可以有任意多个`expect`语句，只有所有断言都为真，该test case才通过。

下面结合实例来test case在不同场景下的应用

### 测试Class

在测试类的时候，一般需要测试某个对象是否是该类的实例，类的创建实例的时候是否执行了构造函数中的某些代码等等。

`jest`提供了几个api来满足上述需求：
- `beforeEach`：当前测试集`describe`范围内，定义在每个test case执行前执行的代码，常用于执行一些初始化工作
- `.toBeInstanceOf()`：检查某个对象是某个类的实例
- `jest.spyOn(Object, method)`：为对象上的某个方法创建一个mock函数，并track该方法
- `.toHaveBeenCalledWith(params)`和`toHaveBeenCalled()`：检查某个方法是否被调用

代码简易实现如下：
```typescript
describe('Test Service Class', () => {
  let service: Service;
  beforeEach(() => {
    // 每个test case前都new一个实例
    service = new Service(serviceConfig);
  });

  it('Service constructor has been called', () => {
    // new出来的实例service应该是Service的实例
    expect(service).toBeInstanceOf(Service);
  });

  it('Service startup and shutdown normally', async () => {
    // track service实例上的startup和shutdown方法
    // 当他们被调用的时候，jest就能追踪到
    const startup = jest.spyOn(service, 'startup');
    const shutdown = jest.spyOn(service, 'shutdown');
    // 手动调用service的startup方法
    await service.startup(startupConfig);
    // startup方法应该被调用了，且传入的参数为startupConfig
    expect(startup).toHaveBeenCalledWith(startupConfig);

    service.shutdown();
    // shutdown方法应该被调用了
    expect(shutdown).toHaveBeenCalled();
  });
```

读者可能已经注意到了，在第二个test case中，我们使用了`async`函数作为回调函数。
这其实是jest支持测试异步代码的一种写法，下面简要介绍下如何用jest测试异步代码。

### 测试异步代码

我们知道，JS世界里充满了异步代码。
正常情况下测试代码是同步执行的，但当我们待测的代码是异步的时候，就会有问题了，会导致test case已经结束了，但是我们的异步代码并没有执行，从而导致异步代码没有被测到。那怎么办呢？
对于当前test case来说，异步代码什么时候执行它并不知道，因此解决方法很简单。当有异步代码的时候，test case跑完同步代码后不立即结束，而是等结束的通知，当异步代码执行完后再告诉jest：“好了，异步代码执行完了，你可以结束任务了”。

jest提供了四种方案来测试异步代码，下面我们分别来看一下。

#### `done`关键字

当我们的test函数中出现了异步回调函数时，可以给test函数传入一个`done`参数，它是一个函数类型的参数。如果test函数传入了`done`，jest就会等到`done`被调用才会结束当前的test case，如果`done`没有被调用，则该test自动不通过测试。

```javascript
  it('Test async code with done', (done) => {
    setTimeout(() => {
      // expect something
      done();
    }, 0)
  });
```
上面的代码中，我们给test函数传入了`done`参数，在`setTimeout`的回调函数中调用了`done`。这样，setTimeout的回调中异步执行的测试代码就能够被执行。

#### 返回Promise




