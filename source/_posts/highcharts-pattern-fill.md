---
title: highcharts-pattern-fill
date: 2017-05-14
tags: ['hightcharts', '前端', 'js']
reward: true
comment: true
---

> [Highcharts](https://www.highcharts.com/)是一个优秀的数据可视化图表库，它支持的图表类型有直线图、曲线图、区域图、柱状图、饼状图、散状点图、仪表图、气泡图、瀑布流图等多达 20 种图表。同时，Highcharts具有很高的自定义度，只需要通过JSON对象进行配置即可。在最近的一个需求中用到了区域图，有“像素眼”之称的设计师大大Jerry要求区域图的填充必须为斜线，调研了一番之后发现Highcharts本身并不支持斜线填充。所幸的是highcharts提供了一个可以实现此功能的插件[pattern-fill](https://github.com/highcharts/pattern-fill)。本文将总结pattern-fill的用法及使用过程中遇到的一些坑。

## pattern-fill

### 简介
pattern-fill作为Highcharts的一个插件存在，顾名思义，这个插件可以帮助我们在任意区域内用图案进行填充。pattern-fill目前更新到2.X版本，其中1.X版本兼容Highcharts 3，而2.X版本与Hicharts 4+ 兼容。两个版本的主要区别是：1.X 只支持使用图像进行填充，而2.X版本除了支持图像填充、更改了部分API之外，最重要的新特性是支持SVG填充，这大大增强了其适用性。

本文主要介绍2.X版本的pattern-fill。
<!-- more -->

### 源码分析

了解了pattern-fill的特点，我们先研究下这个小插件的[源码](https://github.com/highcharts/pattern-fill/blob/master/pattern-fill-v2.js)，其源码只有180多行，是谓之“小插件”。

**注：** 源码分析部分直接在代码中添加注解

我们来看下pattern-fill的核心代码：

```js
var idCounter = 0;
var wrap = Highcharts.wrap;
var each = Highcharts.each;

/**
 * 在Highcharts的SVGRenderer对象的原型对象上添加一个addPattern方法，该方法在渲染器上添加一个svg pattern
 * @param  {String} id      pattern的id号
 * @param  {Object} options 配置项
 * @return {Object}         pattern
 */
Highcharts.SVGRenderer.prototype.addPattern = function (id, options) {
    var pattern;
    var path;
    var w = options.width || 10;
    var h = options.height || 10;
    var ren = this;

    /**
     * 定义一个实心矩形，后面用于填充pattern的背景
     * @param  {String} fill [description]
     */
    function rect(fill) {
        ren.rect(0, 0, w, h)
            .attr({
                fill: fill
            })
            .add(pattern);
    }

    if (!id) {
        id = 'highcharts-pattern-' + idCounter;
        idCounter += 1;
    }

    pattern = this.createElement('pattern').attr({
        id: id,
        patternUnits: 'userSpaceOnUse', // 表示坐标系统由pattern被引用处的坐标系统确定
        width: options.width || 10,
        height: options.height || 10
    }).add(this.defs);

    // Get id
    pattern.id = pattern.element.id;

    // 第一种模式：用SVG path 来定义pattern
    if (options.path) {
        path = options.path;

        // 设置path的背景色
        if (path.fill) {
            rect(path.fill);
        }

        // 用path来绘制pattern
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

    // A solid color
    }
    else if (options.color) {
        rect(options.color);
    }
    // 设置透明度
    if (options.opacity !== undefined) {
        each(pattern.element.children, function (child) {
            child.setAttribute('opacity', options.opacity);
        });
    }
    return pattern;
};
```
上面的代码在Highcharts的SVGRenderer对象的原型对象上添加一个addPattern方法，该方法执行的结果是返回一个定义好的pattern。
代码中有两种定义pattern的方式：SVG path和image，根据使用者传入的不同配置项来使用不同的方式。对于SVG path方式，需要传入的主要配置项有：id、path对象、height、width、透明度等，其中path对象需要配置路径（d）、线条颜色、背景色、线条宽度等。

在另外一段代码中：
```js
if (Highcharts.VMLElement) {
    Highcharts.VMLRenderer.prototype.addPattern = function (id, options) {
        var patterns;
        if (!id) {
            id = 'highcharts-pattern-' + idCounter;
            idCounter += 1;
        }
        patterns = this.patterns || {};
        patterns[id] = options;
        this.patterns = patterns;
    };

    // wrap函数时Highcharts提供的用于扩展已有原型对象方法的工具，这里使用wrap函数重写了Element原型对象上的`fillSetter`函数
    // 使得Highcharts在渲染元素的颜色时支持以`url(#pattern-id)`的方式来设置颜色和填充色
    // proceed是被重写的函数本身，作为第一个参数传入回调
    Highcharts.wrap(Highcharts.VMLRenderer.prototype.Element.prototype, 'fillSetter', function (proceed, color, prop, elem) {
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
}
```
在VMLRenderer原型对象上也定义了对应的addPattern方法，这个方法重写了每个元素的`fillSetter`方法。因此在使用Highcharts时，我们就能在任意可配置color或fillColor的地方使用我们自定义的pattern，使用实例见后文。

最后一段代码将自定义的pattern都添加到defs中。defs是SVG规范规定的用于存放待使用的图形对象的容器，Highcharts也对这个特性提供了支持，因此，这里将定义的pattern对象都添加到defs对象中：
```js
// 重写getContainer函数，在其中执行添加patterns的操作
wrap(Highcharts.Chart.prototype, 'getContainer', function (proceed) {
    proceed.apply(this);

    var chart = this,
        renderer = chart.renderer,
        options = chart.options,
        patterns = options.defs && options.defs.patterns;

    // 添加默认的 patterns
    // pattern-fill默认提供了10个patern，一般用不到
    addPredefinedPatterns(renderer);

    // 添加自定义的patterns
    if (patterns) {
        each(patterns, function (pattern) {
            renderer.addPattern(pattern.id, pattern);
        });
    }
});
```
### 用法

分析完pattern的源码，其用法就很明了了：先在defs中定义自己的pattern（svg或图片），然后在chart的配置项中用`color: url(#pattern-id)`的形式使用pattern。
看一个实例：
```js
options: {
    // defs中自定义pattern
    defs: {
        patterns: [{
            id: 'light-green-pattern',
            path: {
                d: 'M 0 5 L 5 0 M -1 1 L 1 -1 M 4 6 L 6 4',
                stroke: '#00cc26', // 线条颜色
                strokeWidth: 1,
                fill: '#CCF5D4'    // path的背景颜色
            },
            width: 5,
            height: 5
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

