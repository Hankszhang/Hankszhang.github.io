---
title: highcharts-pattern-fill
date: 2017-05-14
categories: Frontend
reward: true
comment: true
---

> [Highcharts](https://www.highcharts.com/)是一个优秀的数据可视化图表库，它具有很高的自定义度，只需要通过JSON对象进行配置即可。在最近的一个需求中要求区域图的填充必须为斜线，调研了一番之后发现Highcharts本身并不支持斜线填充，所幸highcharts提供了一个可以实现此功能的插件[pattern-fill](https://github.com/highcharts/pattern-fill)。本文简要分析pattern-fill的实现原理及使用方法。

<!-- more -->

## pattern-fill简介
pattern-fill作为Highcharts的插件存在。顾名思义，这个插件使得我们可以在任意区域内用图案进行填充。pattern-fill目前更新到2.X版本，其中1.X版本兼容Highcharts 3，而2.X版本与Hicharts 4+ 兼容。两个版本的主要区别是：1.X 只支持使用图像进行填充，而2.X版本除了支持图像填充、更改了部分API之外，最重要的新特性是支持SVG填充，这大大增强了其适用性。

本文主要介绍2.X版本的pattern-fill。

### 源码分析
pattern-fill的源码只有180多行，我们来看一下它都干了些什么。

它做的第一件事是在 **Highcharts的SVGRenderer对象的原型对象上添加一个addPattern方法**，该方法的作用是在渲染器上定义并添加pattern：
```js
Highcharts.SVGRenderer.prototype.addPattern = function (id, options) {
		// 仅看核心代码
		
		// Step1：创建一个pattern并将其添加到defs中
	    pattern = this.createElement('pattern').attr({
			id: id,
			patternUnits: 'userSpaceOnUse', // 表示坐标系统由pattern被引用时所在的坐标系统确定
			width: options.width || 10,
			height: options.height || 10
   		}).add(this.defs);
		
		// Step2: 给pattern添加图像填充
		if (options.path) {
        path = options.path;

        // 设置path的背景色
        if (path.fill) {
            rect(path.fill);
        }

        // 绘制pattern
        this.createElement('path').attr({
			d: path.d || path,
			stroke: path.stroke || options.color || '#343434',
			'stroke-width': path.strokeWidth || 2
        }).add(pattern);
        pattern.color = options.color;

    // 第二种模式：用图片来定义pattern
    }
    else if (options.image) {
        this.image(options.image, 0, 0, options.width, options.height).add(pattern);
	}
};
```
`addPattern` 函数第一步是创建一个pattern并将其添加到defs中， defs是SVG规范规定的用于存放待使用的图形对象的容器，Highcharts也对这个特性提供了支持，因此，这里将定义的pattern对象都添加到defs对象中。
这里支持了SVG的path和图像两种方式来定义pattern，通过传入不同的options来使用不同的定义方式：使用svg时配置path属性，而image则配置image属性。

定义好了pattern之后，还需要让Highcharts的渲染引擎支持两种方式的渲染。pattern-fill是通过重写Highcharts元素的`fillSetter`函数来实现的：
```js
    // proceed是被重写的函数本身，作为第一个参数传入回调
    Highcharts.wrap(Highcharts.VMLRenderer.prototype.Element.prototype,
	'fillSetter', function (proceed, color, prop, elem) {
        if (typeof color === 'string' && color.substring(0, 5) === 'url(#') {
            var id = color.substring(5, color.length - 1),
                pattern = this.renderer.patterns[id],
                markup;

            if (pattern.image) {
                // Remove Previous fills
                if (elem.getElementsByTagName('fill').length) {
                    elem.removeChild(elem.getElementsByTagName('fill')[0]);
                }

                markup = this.renderer.prepVML(['<', prop, ' type="tile" src="', pattern.image, '" />']);
                elem.appendChild(document.createElement(markup));

                // Work around display bug on updating attached nodes
                if (elem.parentNode.nodeType === 1) {
                    elem.outerHTML = elem.outerHTML;
                }

            } else if (pattern.color) {
                proceed.call(this, pattern.color, prop, elem);
            } else {
                proceed.call(this, '#A0A0A0', prop, elem);
            }
        } else {
            proceed.call(this, color, prop, elem);
        }
    });
```
Highcharts不仅本身具有丰富的API可供使用，而且还提供了一些工具方法用于扩展，详细请参考[Extending Highcharts](https://www.highcharts.com/docs/extending-highcharts/extending-highcharts)。`wrap`函数就是Highcharts提供的用于扩展已有原型对象方法的工具函数，这里使用它重写了Element原型对象上的`fillSetter`函数，使得Highcharts在渲染元素的颜色时支持以`url(#pattern-id)`的方式识别svg path和image。

## 用法

分析完pattern的源码，其用法就很明了了：先在defs中定义自己的pattern（svg或图片），然后在chart的配置项中用`color: url(#pattern-id)`的形式使用该pattern。
看一个实例：
```js
options: {
    // defs中自定义pattern
    defs: {
        patterns: [{
			// SVG pattern
            id: 'light-green-pattern',
            path: {
                d: 'M 0 5 L 5 0 M -1 1 L 1 -1 M 4 6 L 6 4',
                stroke: '#00cc26', // 线条颜色
                strokeWidth: 1,
                fill: '#CCF5D4'    // path的背景颜色
            },
            width: 5,
            height: 5
        }, {
		// image pattern
		id: 'image-pattern',
		image: 'src/images/loading.png'
		}]
    }
},
series: [{
    name: '浏览量',
}, {
    name: '访客数',
    // 在配置项series中根据id使用自定义pattern
    fillColor: 'url(#light-green-pattern)',
    color: 'url(#light-green-pattern)',
    lineWidth: 0,
    marker: {
        fillColor: '#00cc26'
    }
}]
```
下面是使用自定义斜线填充的效果图，完美符合设计师大大的要求。

<img src="/assets/img/splash-chart.png" width="1000">

终于可以开心地使用Highcharts了！

