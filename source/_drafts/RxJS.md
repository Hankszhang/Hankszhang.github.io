---
title: 图解RxJS
categories: Frontend
comment: false
date: 2017-11-18 16:02:07
tags:
---

> 现在的前端越来越关注数据层的设计，我们团队的新项目 —— `融合工作台`因其数据和业务之复杂，需要同/异步获取多样数据源并整合展示，使用RxJS来设计数据层可以很好的满足我们的需求。RxJS是一个比较新颖的概念，本文通过自己梳理的几张图来阐述对RxJS的理解。

阅读[RxJS官方文档](http://reactivex.io/rxjs/)，我的第一感觉是一脸懵逼 ———— 这NM是个啥，核心概念Observable都找不到对应的汉语词语来翻译！行，那就先把母语放一边，通过英译来理解你。个人的心得：对于这种用抽象词汇来表述的概念，不要尝试去翻译成中文词汇，因为往往找不到准确的中文词语来表述，而应该采用英英释义的方式去理解，也许你那从高中毕业后就尘封的牛津词典可以拿出来翻翻。所幸官方文档对每个基本概念都给出了通俗易懂的一句话解释，并用斜体字“划重点”。理解了这几句重点，也就理解了RxJS。

## 基本概念理解

官方介绍RxJS用了一句话：**Think of RxJS as Lodash for events**。我们都知道`Lodsh`是一个强大的工具库，而把`RxJS`看作是专为处理事件的`Lodash`，可以知道，`RxJS`的特点是处理事件，自然就包括同步和异步的处理。

`RxJS`的的全称是Reactive Extensions for JavaScript，即JavaScript的响应式扩展。响应式的思路是：把不断变化的数据（状态/事件等）转换成Observable对象，数据的消费者只需要订阅Observable对象的变化，一旦数据发生变化，就会执行事先部署好的执行序列。

`RxJS`的API提供了一个核心类型：`Observable`, 以及五种辅助类型：`Observer`, `Subscription`, `Subject`, `Operators`, `Scheduler`。下面分别来看这几个基本概念。

### Observable
- *Observables are like functions with zero arguments, but generalize those to allow multiple values*
- *Observables are able to deliver values either synchronously or asynchronously*

一个Observable是一个从它被调用开始，可以同步或异步地返回0至无穷多个值的懒计算。它具有三个特点：
1. 可以产生多个值
2. 同时支持同步和异步
3. 懒计算：只有当它被调用时才会开始产生值

下图将Observable解构为4部分来帮助理解
![observable](/assets/img/observable.png)

### Observer

### Subscription

### Subject

### Operators

### Scheduler

## 一张图理解RxJS

通读完文档和示例，再结合自己的理解，发现整个RxJS的概念可以用一幅图来阐述。

<img src="/assets/img/rxjs.png" width="1000">

## RxJS需要注意的点

- Observable 只有在被subscribe的时候才会被初始化执行
- 民工叔的文章理解