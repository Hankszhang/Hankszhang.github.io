---
title: vue-directives
date: 2017-05-07 23:04:54
tags: [技术, 前端, Vue]
---

> 我们都知道在Vue中，代码复用和抽象的主要形式是**组件**。但是在有些情况下，我们可能仅需要操作一些普通元素，这个时候如果也使用自定义组件会显得很笨重。因此，Vue允许注册自定义指令来实现一些简单的功能。本文将结合自定义指令`on-scrollto`来看看在Vue中是如何实现自定义指令的。

## 注册指令

首先，我们需要在Vue上注册我们的指令。Vue提供了两种方式来注册指令，第一种是全局注册的方式：
```js
// 定义一个全局的自定义指令：v-on-scrollto
Vue.directive('name', {
    // 定义该指令的一系列钩子函数，这些钩子函数都是可选的
    bind() {},  // 仅在指令第一次绑定到元素上时被调用，用于做初始化
    inserted() {},  // 绑定的元素被插入到父节点时被调用
    update() {},    // 使用该指令的组件有更新时被调用，可能早于其子组件的更新
    componentUpdated() {},  // 组件及其子元素都更新完之后才会被调用
    unbind() {} // 指令从元素上解绑时被调用
})
```

另一种是局部注册的方式，组件可以接受一个`directives`配置项，这种方式定义的指令只能作用于当前组件：
```js
directives: {
    name: {
        // directive definition
    }
}
```
## 钩子函数的参数

上面用于定义指令的钩子函数都会被传入下列参数，我们通过在钩子函数中使用这些参数来实现指令的功能：

- `el`: 绑定指令的元素，可以直接用来操作DOM
- `binding`: 一个包含下列属性的对象
    - `name`: 指令的名字，不包括`v-`前缀
    - `value`: 指令接收的值，如`v-on-scrollto="v-my-directive="1 + 1"`对应的value值为2
    - `oldValue`: 指令的上一个值，只在update和componentUpdated函数中可用
    - `expression`: 绑定指令的表示字符串，如上面的`"1 + 1"`
    - `arg`: 传入指令的参数，如果有的话。如`v-my-directive:foo`中的参数为`foo`
    - `modifiers`: 如果有修饰符的话，该参数为包含修饰符的对象，如`v-my-directive.foo.bar`，modifiers的值为：`{foo: true, bar: true}`
- `vnode`: Vue编译器生成的虚拟节点
- `oldVnode`: 上一个虚拟节点，只在update和componentUpdated中可用

## `on-scrollto`指令的实现

接下来我们结合代码看看`on-scrollto`指令是怎么定义的。顾名思义，这个指令实现的功能是：绑定元素滚动到某个位置时，执行某些操作。我们直接来看代码。

这里为了与Vhtml的组件定义形式保持一致，将指令的定义拆分为两个文件：index.js 和 on-scrollto-directive.js文件，index.js文件作为指令的入口，而on-scrollto-directive.js文件则保存了指令的具体定义。
index.js中的代码：
```js
import OnScrollto from './src/on-scrollto-directive';

/* istanbul ignore next */
OnScrollto.install = function (Vue) {
    Vue.directive(OnScrollto.name, OnScrollto);
};

export default OnScrollto;
```
on-scrollto-directive.js中的代码：

```js
import {on, off, getComputedStyle} from 'vhtml-ui/src/utils/dom';
import debounce from 'vhtml-ui/src/utils/debounce';

const POSITION_MAP = {
    bottom: function (el, currentTop) {
        const styles = getComputedStyle(el);
        const borderTop = parseInt(styles.borderTopWidth, 10);
        const borderBottom = parseInt(styles.borderBottomWidth, 10);
        const targetTop = el.scrollHeight - (el.offsetHeight - borderTop - borderBottom);
        return (currentTop > 0) && (currentTop >= targetTop);
    },
    top: function (el, currentTop) {
        return currentTop <= 0;
    }
};

const calcPostion = debounce(function (el, binding) {
    if (typeof binding.value !== 'function') {
        return;
    }

    Object.keys(binding.modifiers).forEach((mod, index) => {
        if (!POSITION_MAP[mod]) {
            return;
        }

        const currentTop = el.scrollTop;
        const result = POSITION_MAP[mod](el, currentTop);
        if (result) {
            binding.value(mod, currentTop);
        }
    });
}, 200);

const HOOK_PROPNAME = 'VHTML_ON_SCROLLTO_DIRECTIVE';

export default {
    name: 'on-scrollto',

    bind(el, binding, vnode) {
        const onscroll = function () {
            calcPostion(el, binding);
        };
        on(el, 'scroll', onscroll);

        Object.defineProperty(el, HOOK_PROPNAME, {
            value: onscroll,
            enumerable: false
        });
    },

    unbind(el) {
        const onscroll = el[HOOK_PROPNAME];
        off(el, 'scroll', onscroll);
    }
};
```
我们定义了一个
