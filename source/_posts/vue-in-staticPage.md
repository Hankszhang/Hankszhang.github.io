---
title: 填坑行动之纯静态页面中使用Vue
categories: Frontend
comment: false
date: 2017-07-26 14:15:49
tags:
---


> 现在团队除了一些老项目，基本上已经完全切换到了Vue，我们也开发了自己的基础组件库`VHTML`。不过最近接手的一个项目是纯静态的，没有使用任何的构建或打包工具。但是设计师大大给出的设计稿沿用了基础组件库的设计风格，如果要用jQuery来实现，工作量将会很大，因此考虑在页面中引入Vue并使用VHTML的基础组件，从而大大缩短开发量。本以为像使用jQuery一样，简单的引入Vue之后使用就可以了，事实证明我还是too young too naive。就用这篇文章来纪念一下开发过程中踩过的各个坑。

<!-- more -->

## 1号坑

第一件事情当然是引入Vue，由于我们没有webpack这样的编译工具，需要实时编译模板，因此不能使用`runtime`版本的Vue(vue.runtime.js)，而必须使用包含编译器的完整版Vue(vue.js)。

之前在`.vue`文件中写vue代码时，我们是将整个vue文件当做一个组件来看的，而在js文件中写Vue部分的代码跟写`.vue`文件有点不一样，我们需要手动new一个全局的vue实例，如下：
```javascript
var vueInstance = new Vue({
    el: '#app',
    data: function() {},
    methods: {}
});
```
经实际测试，在IE的兼容性模式下，将
```javascript
data: fucntion () {}
```
简写为：
```javascript
data() {}
```
类似这样额缩写写法偶尔会报错，但是不是百分之百复现，可能跟浏览器兼容性设置有关，所以为了兼容IE9，最好不要采用简写的写法。

## 2号坑

好了，成功在页面中引入了Vue和VHTML，官方说Vue支持IE9+，随即在IE9上测试一下，页面并没有像预期中的完美呈现。

打开IE9的调试面板，发现IE9是将我们的页面按照IE7兼容模式来渲染的，自然不支持Vue。于是检查页面`<head>`中的兼容性配置，此时的配置如下：
```html
<head>
    <script>
        var GSTS = new Date();
    </script>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1,user-scalable=no">
</head>
```
咦，没有问题呀，`<meta http-equiv="X-UA-Compatible" content="IE=edge">`告诉IE浏览器以它支持的最高级的模式呈现页面，但是为什么这里没有生效，而是以IE7的模式渲染的呢？

为了解决这个问题，将[页面兼容性设置的相关知识](https://stackoverflow.com/questions/6771258/what-does-meta-http-equiv-x-ua-compatible-content-ie-edge-do)都研究了一遍。但是查阅无数资料、试了好几台机器的IE9，都没有找到问题所在。

一个偶然，在查看页面源代码的时候发现：在IE9下以IE标准模式正常呈现的页面的`<meta http-equiv="X-UA-Compatible" content="IE=edge">`标签都是作为`<head>`的第一个标签，而在我的页面中，`<head>`内的第一个标签是一个`script`标签：
```javascript
<script>
    var GSTS = new Date();
</script>
```
果断把这个标签去掉试一试，果然！页面成功已IE9标准模式渲染出来了！

再仔细检查，发现这个项目中所有的页面的`<head>`起始处都添加了这么一段代码，是之前一个同事部署监测代码的时候添加的。果然，其他加了这段代码的页面在IE9下也无法正常呈现。

查阅MDN文档之后发现：<font color="red">`<meta http-equiv="X-UA-Compatible" content="IE=edge">`必须是`<head>`的第一个标签才能生效！</font>

## 3号坑

开发过程中遇到的最棘手的也是费时的坑是CORS跨域问题。

由于当前项目之前是纯静态页面，所以没有专门的PHP服务，因此ajax请求需要走另一套系统的PHP服务，这就需要进行ajax跨域请求了。

这里的使用场景是前端提交查询跨域请求之后由php返回查询结果，因此用jsonp的方式不是很适合，于是想到了用CORS,但是需要后端的配合。行，方案定了之后，一个字就是：干！

CORS跨域请求的具体实施方案，可参考MDN的参考文档[HTTP访问控制（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS#)。

简单的来说，首先在Nginx服务器上需要做如下配置：

```php
#
# Wide-open CORS config for nginx
#
location / {
     if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        #
        # Custom headers and headers various browsers *should* be OK with but aren't
        #
        add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
        #
        # Tell client that this pre-flight info is valid for 20 days
        #
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
     }
     if ($request_method = 'POST') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
        add_header 'Access-Control-Expose-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
     }
     if ($request_method = 'GET') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
        add_header 'Access-Control-Expose-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
     }
}
```

然后，PHP在返回的响应头上加上：`'Access-Control-Allow-Origin' '*'`，最后前端在使用jQuery发送ajax请求时，需要配置`crossDomain`参数为`true`。


按上面的方案配置好后，基本上就可以解决跨域问题了。但是在测试环境中，由于公司代理的影响，会导致跨域的时候不断的发生302重定向，猜测可能是公司代理服务器不允许跨域请求。

在兼容性方面，这个方案支持主流的浏览器，包括IE8+。

做完这个需求，虽然感觉自己脱了一层皮，加了几天的班就为了解决一些从没遇到过的奇奇怪怪的问题，但经历风雨方能见到彩虹。

一通折腾下来，最大的感受是：脱离现有开发框架，收获的东西远比在既定框架里开发来得多。
