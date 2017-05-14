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
pattern-fill作为Highcharts的一个插件存在，顾名思义，这个插件可以帮助我们在任意区域内用图案进行填充。pattern-fill目前更新到2.X版本，其中1.X版本兼容Highcharts 3，而2.X版本与Hicharts 4+ 兼容。两个版本的主要区别是：1.X 只支持使用图像进行填充，而2.X版本除了支持图像填充，更改了部分API之外，最重要的新特性是SVG填充，这大大增强了其适用性。

本文主要介绍2.X版本的pattern-fill。
<!-- more -->

### 源码分析

### 用法



