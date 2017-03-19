---
title: 闭包那点事儿
date: 2017-03-15 11:48:37
tags: [技术, JS, 前端]
---

> 一直以来都没有彻底理解JavaScript的闭包特性及其使用，《JavaScript Ninja》中 **闭包** 一章是我读过讲解闭包的书籍或博客中，梳理的最清晰的，以此为基础整理了自己对闭包的理解。

## 主要内容

1. 闭包是什么，如何工作？ - 闭包的几个重要概念
2. 使用闭包
    - 私有变量
    - 函数回调与计数器
    - 绑定函数上下文
    - 偏应用函数
    - 函数重载
    - 立即执行函数
<!-- more -->

## 什么是闭包？

简单的说，闭包(closure)是一个函数在创建时允许让自身函数访问并操作该自身函数所在作用域内的变量时所创建的作用域。

我们来分析闭包的这个定义。闭包代表的是一个函数的作用域，那么这个作用域有什么特点呢？首先，这个作用域在函数创建的时候就存在了；其次，这个作用域可以让创建的这个函数可以访问该函数之外（函数被创建时所在的作用域内）的变量。正常情况下，函数执行完之后，它的作用域也就消失了，作用域内的变量也会随之消失。但是如果存在闭包，即使该作用域消失了，其内部的某些变量和函数仍能被访问到。这就是闭包的作用。

我们来看一个简单的闭包：
```js
var outer = 'outerman';
var later;

function outerFunction() {
    var inner = 'innerman';
    function innerFunction() {
        console.log(outer);
        console.log(inner);
    }
    later = innerFunction;
}

outerFunction();

later();    // outerman
            // innerman
```
执行上面的代码后，肯定会输出“outerman”，因为outer变量是在全局作用域的，在任何作用域内都可见。那么inner变量是输出‘innerman’还是undefined呢？

答案是输出“innerman”。执行外部函数`outerFunction`之后，我们通过引用变量later来调用内部函数，内部函数执行时，外部函数内的作用域（inner变量所在的作用域）已经不复存在。那么我们的内部函数又怎么能够访问到该变量呢？这就是闭包的魔力！

外部函数中声明innerFunction的时候，不仅声明了函数，还为该函数创建了一个闭包，该闭包不仅包含函数声明，还包含了函数声明的那一刻该作用域中的所有变量。因此，虽然外部函数的作用域消失了，仍可以通过闭包访问到原始作用域中的inner变量。

如下图所示，闭包就像一个“安全气泡”，包含了声明函数那一刻的作用域内的所有函数和变量，为该函数的执行提供了所需的所有条件。

![闭包](/assets/img/closure.png)

接下来我们看一个复杂一点的闭包，了解下闭包的一些核心原则。
```js
var outer = 'outerman';
var later;

function outerFunction() {
    var inner = 'innerman';
    function innerFunction(param) {
        console.log(outer);
        console.log(inner);
        console.log(param);
        console.log(toolate);
    }
    later = innerFunction;
};
console.log(toolate); // undefined
var toolate = 'comming'; 

outerFunction();
later('pass');      // outerman
                    // innerman
                    // post
                    // comming
```
执行上面的代码后，四个变量均会输出相应的值，即使是在内部函数声明之后声明的变量toolate也能在内部函数被访问到。

这个结果可以总结出闭包的三个核心原则：
- 内部函数的参数是包含在闭包中的。
- 作用域之外的所有比阿娘，即便是函数声明之后的那些声明，也都包含在闭包中。
- 相同的（闭包）作用域内，尚未声明的变量不能进行提前引用。

理解了闭包的核心原则，我们基本上就明白了闭包是个什么东东。另外一点需要注意的是，闭包的使用是有代价的：闭包里的信息会一直保存在内存里，直到JS引擎确认这些信息不会再被使用之后才会被回收。

接下来，我们总结下在实际开发过程中使用闭包的常见情况。

未完待续。。。










