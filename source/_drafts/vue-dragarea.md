---
title: 基于Vue的跨区域拖拽方案实现
comment: false
date: 2018-07-06 16:03:01
categories: Frontend
tags: ['JavaScript', 'Vue', 'drag']
---

> 数据驱动是Vue的核心思想之一，Vue官方也鼓励使用数据驱动思想进行开发，这样可以有效利用Vue的diff算法提升性能。拖拽是前端开发中一种常见的交互形式，本文介绍一种利用Vue的数据驱动特性和双向绑定能力实现的跨区域拖拽方案(兼容IE9+)。

<!--more-->

## 设计方案

#### 整体框架

首先考虑到需要兼容IE9，因此不能使用现代浏览器原生支持的[HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)，而改用`mousedown`、`mousemove`和`mouseup`的组合来模拟拖拽操作。

模拟拖拽的思路其实很简单，在组件上注册`mousedown`事件的回调，并在回调函数中将`mousemove`和`mouseup`事件注册到`document`上，在它们各自的回调函数中分别处理中间态处理和drop操作，代码示例如下：

**注：注册的事件一定要记得解绑。**

```js
mounted() {
    on(this.$el, 'mousedown', this.mouseDown, false);
},

methods: {
    mouseDown(e) {
        on(document, 'mousemove', this.mouseMove);
        on(document, 'mouseup', this.mouseUp);
        // 初始化
    },

    mouseMove(e) {
        // 处理拖拽中间态
    },

    mouseup(e) {
        this.offEvents;
        // 执行或取消 drop 操作
    },
    offEvents() {
        off(document, 'mousemove', this.mouseMove);
        off(document, 'mouseup', this.mouseUp);
    }
}
beforeDestroy() {
    this.offEvents();
    off(this.$el, 'mousedown', this.mouseDown, false);
}
```

#### 拖拽中间态处理

