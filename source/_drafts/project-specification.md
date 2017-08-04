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

我自己喜欢使用[Atom](https://atom.io/)进行编码，以Atom为例，在Atom中安装[linter](https://atom.io/packages/linter)和[linter-eslint](https://atom.io/packages/linter-eslint)插件，eslint就会实时检查当前文件中的代码是否符合规范，on the fly!

## Git hooks

像其他的版本控制工具一样，git也提供了“钩子”功能——[Git hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)，用于在特定的重要动作发生时触发自定义脚本。git有客户端钩子和服务端钩子两种，客户端钩子用于提交、合并等场合，而服务端钩子则用于诸如接收push request、身份校验等场景。我们这里主要关注客户端钩子。

- `pre-commit`钩子：在键入提交信息前运行,可以在提交前对代码风格进行校验,如果验证不通过，git将放弃刺激提交。当然，我们可以通过`git commit --no-verify`来跳过这个步骤
- `commit-msg`钩子：该钩子接收存有当前提交信息的临时文件作为参数，可用于检查项目状态或提交信息

利用上述的两个钩子，就可以在执行commit的时候执行我们的自定义脚本。

推荐使用[husky](https://github.com/typicode/husky)来管理hook脚本，该工具跨平台支持所有的git hooks，且可以很方便的管理自定义脚本。

## 代码检查

使用eslint检查代码很简单，直接使用`eslint`指令即可，如执行：
```javascript
eslint --quiet index.js
```
当然，该命令的参数也支持多文件名和文件夹，更是支持`*`匹配模式，因此我们可以在此基础上自定义自己的调用命令，这个稍后再介绍。

需要注意的是，在型项目中往往会有成百上千个文件，如果每次提交前都对所有的文件进行检查是效率很低的。因此，我们只对每次提交时修改过的文件进行检查，也就是只检查当前为`staged`状态的文件。

`git diff HEAD --name-only`指令可以获得当前处于`staged`状态的所有文件的文件名(包含相对路径)，之后再调用`eslint`命令就能对实现commit前对代码文件袋呃检查，如果有某一个文件没有通过检查，则校验失败，当前`commit`也会被中止。

[lint-staged](https://github.com/okonet/lint-staged)可以帮助我们达到上述的目的，它的优点是非常友好，校验不通过的文件会高亮输出错误，一目了然。而且，该插件不仅支持js的检查，也支持css/scss的检查。只需要在package.json文件中配置好被检查的文件目录及对应的检查工具就可以了，如：
```json
{
    "name": "xxxx",
    "version": "1.0.0",
    "description": "A Vue.js project",
    "scripts": {
        "precommit": "lint-staged"
    },
    "lint-staged": {
        "build/**/*": "eslint",
        "config/**/*": "eslint",
        "src/**/*.{js,vue}": "eslint"
    }
}
```
配置好后，每次在执行`git commit`时，都会对lint-staged中所指定的目录下处于`staged`状态的文件执行eslint检查。





















