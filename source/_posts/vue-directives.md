---
title: Vue之自定义指令
date: 2017-05-07 23:04:54
tags: [技术, 前端, Vue]
reward: true
comment: true
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
<!-- more -->

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
// 引入定义指令的文件
import OnScrollto from './src/on-scrollto-directive';

// 定义OnScrollto的install函数，该函数内部是声明on-scrollto指令的语句
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

### 指令定义解析

我们分步骤来看定义指令的代码，首先看定义的主体，即下面几行代码：
```js
HOOK_PROPNAME = 'VHTML_ON_SCROLLTO_DIRECTIVE';
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

在钩子函数`bind`中使用了el、binding、vnode三个参数。首先，声明了一个onscroll函数，该函数里会执行我们定义的calcPostion函数，我们稍后再分析这个函数的代码。随后将onscroll函数绑定为元素原生`scroll`事件的回调函数，每当元素的scroll事件被触发时，就会执行calcPostion函数。然后，在元素上定义了一个不可枚举的属性`VHTML_ON_SCROLLTO_DIRECTIVE`，它的值为`onscroll`。我们通过这个属性来标记元素是否绑定了`onscroll`回调函数。
钩子函数`unbind`很简单，只是解除了`onscroll`函数的绑定。

POSITION_MAP定义了两个触发条件（两个位置计算函数）：bottom和top，它们都返回Boolean类型的值，内部的逻辑分别是满足滑动到元素底部的条件和滑动到元素顶部的条件。某个函数返回值为真时，表示对应的条件成立（滚动条滑到了底部或顶部）。
```js
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
```

再看`calcPostion`函数：
```js
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
```
因为我们无法知道DOM元素的原生事件的触发周期，因此这里calcPostion函数的定义使用了防抖动函数debounce，使得calcPostion函数在200ms内只被执行一次。

然后会遍历指令绑定的修饰符，如果指令的当前修饰符绑定的值不是函数，则直接返回；如果绑定的值是函数，且滚动条的位置满足触发条件（bottom或top)，则执行指令绑定的回调函数（即指令的绑定值）。

就这样，简单的`on-scrollto`指令就定义好了，它具有两种修饰符可选：bottom、top，滑动滚动条满足相应的条件就会将指令绑定的值（函数）作为回调函数执行。

## 使用指令

在元素上绑定指令的格式很简单，如下：
```html
<element v-on-scrollto.bottom="handleToBottom"></element>
<element v-on-scrollto.top="handleToTop"></element>
```

## 总结
本文通过一个简单的滚动条指令来说明了Vue中自定义指令的定义规范，麻雀虽小五脏俱全。通过本例的扩展即可编写更加复杂而实用的自定义指令。
