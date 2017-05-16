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

源码的头部定义了CommonJS风格的接口，并传入全局变量Highcharts，由此也可以看出该插件必须依赖Highcharts而存在。
```js
(function (factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        factory(Highcharts);
    }
}(function (Highcharts) {
    'use strict'
    // 源码
}));
```

第一部分的源码：

```js
var idCounter = 0;
var wrap = Highcharts.wrap;
var each = Highcharts.each;

/**
 * Exposed method to add a pattern to the renderer.
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
     * Add a rectangle for solid color
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
        patternUnits: 'userSpaceOnUse',
        width: options.width || 10,
        height: options.height || 10
    }).add(this.defs);

    // Get id
    pattern.id = pattern.element.id;

    // Use an SVG path for the pattern
    if (options.path) {
        path = options.path;

        // The background
        if (path.fill) {
            rect(path.fill);
        }

        // The pattern
        this.createElement('path').attr({
            d: path.d || path,
            stroke: path.stroke || options.color || '#343434',
            'stroke-width': path.strokeWidth || 2
        }).add(pattern);
        pattern.color = options.color;

    // Image pattern
    }
    else if (options.image) {
        this.image(options.image, 0, 0, options.width, options.height).add(pattern);

    // A solid color
    }
    else if (options.color) {
        rect(options.color);
    }
    if (options.opacity !== undefined) {
        each(pattern.element.children, function (child) {
            child.setAttribute('opacity', options.opacity);
        });
    }
    return pattern;
};
```


### 用法



