---
title: Vue中使用Provide/Inject实现全局浮层管理
categories: Frontend
comment: false
date: 2018-02-04 10:27:14
tags:
---


>   在基于Vue构建大型应用时，不可避免地需要在不同层级的组件之间进行通信，Vue提供了`props/event`、`event bus`、`Vuex`、`provide/inject`等方式来实现组件间通信。本文将阐述一种基于provide/inject来统一管理组件库中各类弹窗组件的思路。

<!--more-->

## 背景

### 需求

最近的一个项目中，有这样一个业务场景：webview页面运行在客户端提供的容器（浏览器）内，当webview中有浮层出现时，需要拿到这个浮层的大小和位置等信息进行计算，并通知客户端调整容器内显示的内容，交互形式如下图所示。

<div style="text-align: center;">![webview_AIO](/assets/img/webview_AIO.png)</div>

我们项目中使用了团队自主开发的公司内部开源组件库[vhtml](https://github.com/0067ED/vhtml)，目前vhtml有popper、dialog、pannel、contextmenu等常用浮层类组件（下文统称为`overlay`）。根据需求，每当有一个浮层出现时，都要知道这个浮层是谁，它的大小是多少，当前出现在webview页面上的哪个位置。在实际业务应用中，浮层类组件的大小、在页面组件树中的层级和数量都是不可预知的，甚至经常会出现嵌套使用的场景。那么在这种情况下，我们怎么才能知道现在webview页面中哪些浮层组件是打开的，哪些是关闭的呢？换句话说，这种情况下该如何进行组件间通信呢？答案就是provide/inject。

### provide/inject

Vue从2.2.0开始加入了[provide/inject](https://vuejs.org/v2/api/#provide-inject)这对好兄弟，它们主要应用于高阶插件/组件库，以允许一个祖先组件向其所有子孙后代注入一个依赖，不论组件层次有多深，并在起上下游关系成立的时间里始终生效。可见，provide/inject正是解决我们问题的最佳方案，因为它们就是为这种场景而设计的啊！

## 解决方案

### 怎么做

我们的目标是拿到页面中所有打开的overlay。现在，让我们换一种思路——我们不主动去“获取”每个overlay的状态，而是让每个overlay在改变自己的开闭状态时主动通知“管理员”：“嗨，我打开（或关闭）了”。

使用`provide/inject`，我们就可以在overlay与“管理员”之间建立联系：

<div style="text-align: center;">![vue_project_inject](/assets/img/vue_provide_inject.png)</div>

1.  在页面组件树的根组件（本文中是App.vue）上`provide`一个回调函数(暂叫updateCallback)
2.  在每个overlay组件内`inject`这个回调函数，当该overlay组件在打开或关闭时，都调用这个回调函数，并将组件的信息（如key、postion等）传递给回调函数。
3.  在回调函数里统一维护overlay组件的状态及其信息。

### 怎么写

下面我们看看具体的代码实现。

首先，我们需要在`App.vue`中`provide`选项中定义我们的回调函数，该函数应具有统一处理所有overlay的功能。在我们的项目中，我们使用RxJS来实现数据层，关于RxJS的知识这里不赘述，感兴趣的读者可以去[RxJS官网](http://reactivex.io/rxjs/)了解。

```javascript
@Provide('vhtmlOverlayUpdate')
vhtmlOverlayUpdate(key: string, data?: OverlayRect) {
    this.$dispatch('native:updateOverlay', {
        key: key,
        data: data
    });
}
```

这里，我们的回调函数做的事情很简单，就是将overlay传来的数据分发到我们事先定义好的数据流(也就是这里的native:updateOverlay)，在数据流里处理overlays的逻辑。这样做的好处是视图层和数据层可以很好的解耦，视图层负责处理页面渲染相关的逻辑，而相对较重的业务逻辑放在数据层做，这也是我们引入RxJS构建数据层的目的。关于overlays的处理逻辑见后文。

接下来，在每个overlay组件内通过`inject`将定义好的回调函数注入到组件中，可以封装成`mixin`引入到overlay组件中。

```javascript
// mixin文件: overlay.js 
// 用于生成唯一id的工具函数
import uuid from 'vhtml-ui/src/utils/uuid';
// 用一个不容易冲突的key和cb的名字
const VHTML_ANCIENT_OVERLAY_KEYS = 'VHTML_ANCIENT_OVERLAY_KEYS';
const VHTML_OVERLAY_CB = 'vhtmlOverlayUpdate';

export default {
    inject: {
        // 注入overlay变化时的回调函数，用于抛出overlay的位置信息和key值
        [VHTML_OVERLAY_CB]: {
            default: null
        }
    },

    data() {
        const key = `${uuid()}_${Date.now().toString(36)}`;
        return {
            overlayKey: key
        };
    }
}
```

在mixin文件`overlay.js`中，通过`inject`注入了`vhtmlOverlayUpdate`，也就是从`App.vue` provide的回调函数。同时，也为每个overlay组件的生成了一个唯一的key，用于标识该overlay。

这里用到了Vue从2.5.0+开始加入的新特性：支持给`inject`的变量指定默认值。因此，当我们没有从父组件provide`vhtmlOverlayUpdate`变量时，就用它的默认值：`null`。

现在我们就可以在overlay组件里面拿到注入的回调函数和组件的key值了，overlay组件在`show`或`hide`的时候，执行下列代码，就可以将组件的key和position信息通过回调函数抛给数据流了。

```javascript
// 该方法用于统一管理浮层
if (typeof this.vhtmlOverlayUpdate === 'function') {
	this.vhtmlOverlayUpdate(this.overlayKey, isOpen ? getRect(this.$el) : undefined);
}
```

**注**: 为了统一用一个接口，当打开时传入回调函数的第二个参数为组件的位置信息，而关闭时则为`undefined`。

最后，我们维护了一个overlays数组用于保存当前打开的所有overlays，当有overlay有更新时，传入根据参数key和data对overlays数组进行增删改，最后将overlays数组通过流的方式被视图层订阅，视图层便拿到了当前页面中所有打开的overlay和他们的位置信息。

```javascript
updateOverlays(acc: OverlayInfo[], val: OverlayInfo) {
    const key = val.key;
    const data = val.data;
    const overlays: OverlayInfo[] = [...acc];
    const curr = overlays.findIndex((item: OverlayInfo) => item.key === key);
    // 当前overlay已存在于已有overlays中
    if (curr !== -1) {
        // 更新位置信息
        if (data) {
            overlays[curr].data = data;
        }
        // 没有data表示关闭，则从overlays中删除
        else {
            overlays.splice(curr, 1);
        }
    }
    // 当前overlay还未保存于overlays中，则新增
    else if (data) {
        overlays.push({
            key: key,
            data: data
        });
    }
    return overlays;
}
```

**注**: 数据流部分涉及RxJS的知识，不是本文的重点，此处不述。

## 总结

本文主要介绍了一个利用provide/inject对组件库中所有浮层组件实现统一管理的方案。对于业务较复杂的组件间通信，provide/inject是一个很好的方案，它适用于组件层次深、组件多但有一定的收拢性的场景。