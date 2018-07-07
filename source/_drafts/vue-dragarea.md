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

**注：注册的事件一定要记得注销，否则可能会造成内存泄露。**

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

当我们拖动鼠标开始拖拽的时候，需要在`mousemove`的回调中有3个中间态需要处理：

- 更新被拖拽的节点的位置
- 计算拖拽节点hover在哪个节点上（即图中的`dropInfo`，用于表示插入位置，详见后文）。
- 为了支持跨区域拖拽，需要将当前dragarea内的`dropInfo`状态同步到其他dragarea内，这里使用`eventBus`来实现组件间的通信，详见后文。

<div style="text-align: center;">![拖拽中间态](/assets/img/mouseMove.png)</div>

#### 执行drop操作

拖拽结束时，要做的事情就是在`mouseup`的回调中执行或取消drop操作，判断逻辑如下：

<div style="text-align: center;">![drop操作](/assets/img/mouseUp.png)</div>



## 难点及解决方案

了解了整体的设计思路后，我们来看一下实践过程中遇到的一些难点及解决方案。

#### 难点一：drop位置的确定

前文有提到，我们通过`dropInfo`来确定插入的位置，它包含两个字段：

- dropItemId:    作为参考的drag-item的id
- insertType：1表示在参考drag-item之前插入，表示参考drag-item之后插入



那么我们怎么才能计算出这两个字段的值呢？

首先，我们考虑如何得到dropItemId的值。

这里先介绍一个强大的API：[`document.elementFromPoint`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/elementFromPoint)，用它可以获得相对`viewport`指定坐标位置处最顶层的DOM节点。

若将drag-item的id作为属性绑定在其DOM上，借助这个API，找到drag-item，也就就得到dropItemId了：

1、用当前鼠标位置拿到最顶层的DOM

```js
getUnderneathNode(x, y) {
    // 先将dragging item设置为none
    // 以便elementFromPoint能拿到拖拽结束时鼠标位置处的最顶层DOM节点

    addClass(this.$srcNode, 'is-hidden');
    let target = document.elementFromPoint(x, y);
    removeClass(this.$srcNode, 'is-hidden');

    return target || null;
},
```

2、递归找到当前DOM节点所属的v-drag-item

```js
/**
* 根据targetClass找到目标DOM节点
* @param {Element} eTarget 源事件DOM节点
* @param {String} targetClass 具有标记的类名
* @return {Element | null} 返回找到的DOM节点或null
*/
findTargetNode(eTarget, targetClass = ITEM_CLASS) {
    if (eTarget.className && hasClass(eTarget, targetClass)) {
        return eTarget;
    }

    let parent = eTarget.parentNode;
    if (parent) {
        return this.findTargetNode(parent, targetClass);
    }
    return null;
},
```

3、获取DOM节点上的id

```js
getItemId(target) {
    return target.getAttribute('data-id') || '';
}
```

接下来，我们需要通过碰撞热区来确定`insertType`的值。

本组件支持通过自定义类名来定义热区的大小，实现的方法是在真实拖拽节点外面包一层节点，因此一个`v-drag-item`的DOM结构如下：

<div style="text-align: center;">![drag-item](/assets/img/drag-item.png)</div>

我们根据类名`v-drag-item__inner`来找拖拽节点，而在计算碰撞区域的时候则用类名`v-drag-item`。

<div style="text-align: center;">![碰撞热区](/assets/img/drag-item-hotarea.png)</div>

若鼠标位置落在`v-drag-item`的上半部分，则`insertType`为1，反之则为2。



#### 难点二： 滚动处理

在拖拽过程中，如果`v-dragarea`或其父容器有滚动条，那么在某些情况下可能需要在拖到容器底部的时候滚动条自动向下滚动，拖动到顶部的时候则向上滚动。为了实现这个效果，需要在`mousemove`的回调中多做一个逻辑处理。

```js
// 只有开启了自动滚动时才处理
if (this.useAutoScroll) {
    // 获取设置了overflow: scroll的父容器
    const scrollParent = getScrollParent(this.$el);

    // 若父容器存在且出现了可见的滚动条
    if (scrollParent && hasScrollbar(scrollParent)) {
        // 计算滚动方向
        const direction = this.getScrollDirection(scrollParent);
        // 执行滚动
        direction && this.scrollContainer(scrollParent, direction);
    }
}
```

下面的函数可以用来判断一个元素是否真的有可见的滚动条：

```js
/**
 * 判断指定element元素是否有滚动条
 * @param {Element} element 指定的元素
 * @param {String} direction 滚动条方向，默认为垂直方向
 * @return {Boolean} 是否有滚动条
 */
function hasScrollbar(element, direction = 'vertical') {
    if (direction === 'vertical') {
        return element.scrollHeight > element.clientHeight;
    }
    return element.scrollWidth > element.clientWidth;
}
```

滚动方向的判断：

```js
/**
* 根据越界的边界判断滚动条的滚动方向
* @param {Element} scrollParent 有滚动条的父容器
* @return {String} 滚动方向，不越界或滚动条已无法滚动则返回空字符串
*/
getScrollDirection(scrollParent) {
    const containerRect = getRect(scrollParent);
    const srcNodeRect = getRect(this.$srcNode);
    const step = this.scrollStep;
    // 被拖拽的item快到底部了且滚动条还没到底部，则滚动方向为bottom
    if (srcNodeRect.top + srcNodeRect.height + step > containerRect.top + containerRect.height
        && scrollParent.scrollHeight > scrollParent.clientHeight + scrollParent.scrollTop) {
        return 'bottom';
    }
    // 被拖拽的item快到顶部了且滚动条还没到顶部，则滚动方向为top
    if (srcNodeRect.top - step < containerRect.top && scrollParent.scrollTop > 0) {
        return 'top';
    }
    return '';
}
```



#### 难点三： 跨区域状态同步

在多`dragarea`之间拖拽的时候，需要将`dropInfo`中间态从当前`dragarea`同步到其他`dragarea`，这样才可以在其他`dragarea`中拿到当前drop位置，并判断是否出现待drop的样式。

这种情况是典型的兄弟组件或父子组件间的通信，因此可以用`eventBus`来实现，代码如下：

```js
methods: {
    mouseMove(e) {
        // 其他逻辑处理
        eventBus.$emit(
            VHTML_DRAGEAREA_DROPINFO_UPDATE,
            {dropAreaId, dropItemId, insertType}
        );
    }，
    updateDropInfo(val) {
        if (this.allowDrop) {
            let dropItemId = '';
            let insertType = INSERT_AFTER;
            // 只有目标drop区域是当前dragarea的时候才更新
            if (val.dropAreaId === this.areaId) {
                dropItemId = val.dropItemId;
                insertType = val.insertType;
            }
            this.dropItemId = dropItemId;
            this.insertType = insertType;
        }
    }
}，
created() {
    eventBus.$on(VHTML_DRAGEAREA_DROPINFO_UPDATE, this.updateDropInfo);
},
beforeDestroy() {
    eventBus.$off(VHTML_DRAGEAREA_DROPINFO_UPDATE, this.updateDropInfo);
}
```

