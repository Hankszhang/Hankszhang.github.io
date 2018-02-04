---
title: Vue中使用Provide/Inject实现全局浮层管理
comment: false
date: 2018-02-04 10:27:14
categories: Frontend
tags:    
---

>   ​     

>   在基于Vue构建大型应用时，不可避免地需要在不同层级的组件之间进行通信，Vue提供了`props/event`、`event bus`、`Vuex`、`provide/inject`等方式来实现组件间通信。本文将阐述一种基于provide/inject来统一管理组件库中各类弹窗组件的思路。

<!--more-->

## 背景

### 需求

​	最近的一个项目中，有这样一个业务场景：webview页面运行在客户端提供的容器（浏览器）内，当webview中有浮层出现时，需要拿到这个浮层的大小和位置等信息进行计算，并通知客户端调整容器内显示的内容，如下图所示。

​	我们项目中使用了团队自主开发的公司内部开源组件库[vhtml](https://github.com/0067ED/vhtml)，目前vhtml有popper、dialog、pannel、contextmenu等常用浮层类组件。根据需求，每当有一个浮层出现时，我都要知道这个浮层是谁，它的大小是多少，当前出现在webview页面上的哪个位置。在实际业务应用中，上述浮层类组件的大小、在页面组件树中的层级和数量都是不可预知的，甚至经常会出现嵌套使用的case。那么在这种情况下，浮层组件怎样才能在自己出现或消失时告诉别人（可能是父组件、爷组件、根组件等）呢？换句话说，这种情况下该如何进行组件间通信呢？答案就是provide/inject。

### provide/inject

​	Vue从2.2.0开始加入了[provide/inject](https://vuejs.org/v2/api/#provide-inject)这对好兄弟，主要应用于高阶插件/组件库，以允许一个祖先组件向其所有子孙后代注入一个依赖，不论组件层次有多深，并在起上下游关系成立的时间里始终生效。可见，provide/inject正是解决我们问题的最佳方案，因为它们就是为这种场景而设计的啊！

## 思路



## 实现