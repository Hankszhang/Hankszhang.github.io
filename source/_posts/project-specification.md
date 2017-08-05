---
title: 项目中的代码规范检查
categories: Development
comment: false
date: 2017-07-31 19:49:03
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

## 代码格式化

现在，我们已经可以根据eslint rules对代码进行检查，但是仍需要手动定位错误所在的文件及其位置。毕竟码农都是”懒人”，那么能不能更进一步，“一键”修复错误呢？

调研发现，已有一个强大且成熟的工具——[prettier](https://github.com/prettier/prettier)可以实现自动修复，但是美中不足的是它只能根据默认的规则（有少数自己自定义配置项）来格式化代码，而不支持自定义的eslint规则。

查阅eslint的官方文档，惊喜的发现eslint有一个`--fix`参数，在调用`eslint`命令执行检查时加上这个参数，就会自动地尽可能的修复检查错误。利用这个功能，就可以编写一个脚本来处理不同参数下如何自动修复错误的问题了。先上代码：

pretty.js
```javascript
#!/usr/bin/env node

const child_process = require('child_process');
const program = require('commander');
const sgf = require("staged-git-files");

const argv = process.argv;
program
  .version('0.1.0')
  .usage('npm run pretty [-option] <value>')
  .option('-s, --staged', 'Pretty staged js & vue files')
  .option('-a, --all', 'pretty all js & vue files')
  .option('-f, --files [files]', 'pretty file by name')
  .option('-d, --directory [directory]', 'pretty files by directory')
  .on('--help', () => {
      console.log('  Examples:\n');
      console.log('     npm run pretty -- -s');
      console.log('     npm run pretty -- -a');
      console.log('     npm run pretty -- -f src/index.js');
      console.log('     npm run pretty -- -d packages/date-picker/src\n');
  })
  .parse(argv);

if (argv.length === 2) {
    // 未传入参数则输出帮助文档
    program.help();
}
if(program.staged) {
    // get staged files
    // res = {
    //     filename: 'xxxxx',
    //     status: 'ADDED'
    // }
    sgf((err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        let files = res.filter((item) => {
            return item.filename.search(/.js$|.vue$/) !== -1;
        }).map((file) => {
            return file.filename;
        });
        fileStr = files.join(' ');

        console.log('Prettying staged js & vue files in the project:');
        child_process.exec(`eslint --fix --quiet ${fileStr}`, (err, stdout, stderr) => {
            console.log(stdout);
            console.log('Pretty by eslint commpleted\n');
        });
    });
}

if (program.All) {
    console.log('Prettying all js & vue files in the project:');
    child_process.exec(`eslint --fix --quiet --ext .js,.vue src`, (err, stdout, stderr) => {
        console.log(stdout);
        console.log('Pretty by eslint commpleted\n');
    });
}

if(program.files) {
    if (argv.length === 3) {
        program.help();
    }
    console.log('Prettying file(s) by name:');
    child_process.exec(`eslint --fix --quiet ${program.files}`, (err, stdout, stderr) => {
        console.log(stdout);
        console.log('Pretty by eslint commpleted\n');
    });
}

if(program.directory) {
    if (argv.length === 3) {
        program.help();
    }
    console.log('Prettying file by directory:');
    child_process.exec(`eslint --fix --quiet ${program.directory}/**/*.{js,vue}`, (err, stdout, stderr) => {
        console.log(stdout);
        console.log('Pretty by eslint commpleted\n');
    });
}
```
这里使用了[commander](https://github.com/tj/commander)，以便从命令行接收参数并自动生成帮助文档。上述代码定义了4个参数：`staged`、`all`、`files`和`directory`，分别用于格式化`处于staged状态的文件`、`项目中所有的文件`、`参数指定的文件`以及`指定目录内的文件`，这里只对项目中的js和vue文件做检查。
这里使用了node的[`child_process`特性](https://nodejs.org/api/child_process.html)，在脚本内新建一个子进程去处理格式化任务。

调用脚本时，如果未正确传入参数，则用`program.help()`输出帮助文档。
可以在package.json中配置一个`pretty`命令来执行脚本，如：
```json
{
    "scripts": {
        "pretty": "node pretty.js"
    }
}
```
有了如上的配置，就可以在命令行中用`npm run pretty`命令来调用脚本了。根据传入的不同参数和参数值，调用`eslint --fix`执行不同的格式化任务，达到”一键美颜“的目标！

**注意**： npm run 后面的参数只能传给run后面跟的脚本本身，如这里如果执行`npm run pretty -a`，参数`a`只能传递给`pretty`，等效于执行`node pretty.js -a`，
这样在pretty.js内部就拿不到参数`a`。在`npm run`命令的参数前加上`--`，也即：`npm run pretty -- -a`，就可以将命令行的参数传入实际被执行的脚本（pretty.js）了。

## commit信息校验

规范化的commit信息可以：
- 方便浏览定位日志记录
- 自动生成changelog

如上文所述，我们可以在`commit-msg`钩子中来校验commit消息，如检查输入的commit信息是否符合预定义的格式，字符是不是超过预定长度等。

### git commit 格式规范

```javascript
git commit -m '<type>(scope): <detail>'
```
示例：
```javascript
git commit -m 'feature(ivr): change color of svg node'
```

1. `type`：<font color="red">本次commit的类别</font>
  - feature：新功能
  - fix：修补bug
  - doc：文档
  - style： 格式（不影响代码运行的变动）
  - refactor：重构（即不是新增功能，也不是修改bug的代码变动）
  - test：增加测试
  - chore：构建过程或辅助工具的变动

2. `scope`：<font color="red">本次commit所属的需求名或影响范围</font>

3. `detail`：<font color="red">本次commit的简短描述</font>
  - 不超过100个字符
  - 以动词开头，使用现在时，如change、fix、remove等
  - 首字母小写
  - 结尾不加句号（.）


这里我们使用[validate-commit-msg](https://github.com/conventional-changelog/validate-commit-msg)来配置上述的git commit规范。在项目根目录添加`.vcmrc`文件：
```json
{
  "types": ["feature", "fix", "doc", "style", "refactor", "test", "chore", "revert"],
  "scope": {
    "required": true,
    "allowed": ["*"],
    "validate": false,
    "multiple": false
  },
  "warnOnFail": false,
  "maxSubjectLength": 100,
  "subjectPattern": ".+",
  "subjectPatternErrorMsg": "subject does not match subject pattern!",
  "helpMessage": "\ngit commit规范：\n\nExample：\nfeature(ivr): change color of svg node\n\ntype -- 本次commit的类别，可选值：\n - feature：新功能\n - fix：修补bug\n - doc：文档\n - style： 格式(不影响代码运行的变动)\n - refactor：重构(即不是新增功能，也不是修改bug的代码变动)\n - test：增加测试 \n - chore：构建过程或辅助工具的变动\n\nscope -- 本次commit所属的需求名或影响范围\n\ndetail -- 本次commit的简短描述\n - 不超过50个字符\n - 以动词开头,使用现在时，如change、remove等\n - 首字母小写\n - 结尾不加句号(.)",
  "autoFix": true
}
```
如此一来，提交commit的时候都会根据上述模板对commit信息进行校验，如不符合规范则无法提交commit，并提示错误信息。

## 结语
简单地利用ESlint和Git，我们就可以完成代码检查、代码自动修复、commit信息校验的工作，团队合作的效率就像一把梭，on the fly！

















