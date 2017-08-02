---
title: project-specification
comment: false
date: 2017-07-31 19:49:03
categories: Development
tags:
---

> 在团队项目开发中，每个人有不同的编程习惯，包括使用不同的缩进、换行、注释等等，当团队人员逐渐增多之后，代码就会变得越来越来杂乱，这无形中给团队合作增加了困难。因此，制订一套团队的代码规范十分有必要，这套规范应该包含代码风格规范、commit规范、变量术语规范等几个方面。当然有了规范之后，为保证大家严格按照规范来进行开发，需要设置一定的“关卡”来校验这些规范，只有符合规范的代码才能通过。本文介绍利用ESlint+Git来控制项目代码的质量。

<!-- more -->

## ESlint简介

[ESlint](http://eslint.org/)和[Git](https://git-scm.com/docs)是实现这套方案的核心工具。

ESlint是一个插件化的JS和JSX代码检查工具，它可以用于检查常见的JavaScript语法错误，也可以进行代码风格检查。
通过命令：`$ npm install --save-dev eslint`在项目中安装好eslint，我们可以根据自己的项目需求编写自己的ESlint配置文件`.eslintrc`，将此文件至于项目根目录即可。
一个简单的ESlint配置如下：
```json
{
    "env": {
        "mocha": true,
        "es6": true,
        "node": true
    },
    "globals": {
        "document": false,
        "navigator": false,
        "window": true
    },
    "plugins": ["vue"],
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        }
    },
    "rules": {
        "accessor-pairs": 2,
        "array-bracket-spacing": [2, "never"],
        "arrow-spacing": [2, { "before": true, "after": true }],
        "brace-style": [1, "stroustrup", {}],
        "curly": [2, "multi-line"],
        "keyword-spacing": 2,
        "max-depth": [1, 6],
        "max-len": [2, 120, 4, {
            "ignoreUrls": true,
            "ignoreComments": true,
            "ignorePattern": "\\+ [\\w\\W]+>'"
        }],
    }
}
```
具体的配置规则请参考[官方配置文档](http://eslint.org/docs/user-guide/configuring)，这里不再赘述。

配置好ESlint之后，我们有两种方式来使用它，一种是通过命令行的方式：`$ eslint index.js`，这个命令会根据配置的eslint规则对index.js检查，如果index.jx中有不符合规则的地方，会在控制台输出错误提示（有`error`/`warning`两种）及错误所处的文件位置。一般不推荐使用这种方式，因为它只不过是一种补救错误的方法，而我们希望在编码者出错时能够立即提示错误。幸好，我们可以在编辑器中用插件与eslint搭配来满足实时提示错误的需求。

我自己喜欢使用[Atom](https://atom.io/)进行编码，以Atom为例，在Atom中安装[editorconfig](https://atom.io/packages/editorconfig)和[linter-eslint](https://atom.io/packages/linter-eslint)插件，eslint就会实时检查当前文件中的代码是否符合规范，on the fly!

## Git hooks


