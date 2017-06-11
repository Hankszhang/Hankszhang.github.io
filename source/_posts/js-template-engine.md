---
layout: post
title: 简易Javascript 模板引擎
comments: true
reward: true
date: 2017-02-09 20:59:14
categories: Frontend
---

> 最近在研究学习JavaScript的模板引擎的实现原理，读到[Krasimir Tsonev](https://github.com/krasimir)的这篇介绍JS模板引擎实现原理的文章，对于新手很是受用，因此翻译过来。

> 原文链接：[JavaScript template engine in just 20 lines](http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line)

<!--more-->

我还在忙于开发基于JavaScript的预处理器——[**AbsurdJS**](http://krasimirtsonev.com/blog/article/AbsurdJS-fundamentals), 它最开始仅作为CSS预处理器，后来扩展为CSS/HTML预处理器。简而言之，它可以将JavaScript转换为CSS/HTML。自然的，由于它可以生成HTML，因此可以作为模板引擎使用，即将数据填充到标签中。

因此，我想写一个简单的模板引擎逻辑，来完美兼容现在的项目。[**AbsurdJS**](http://krasimirtsonev.com/blog/article/AbsurdJS-fundamentals)主要作为NodeJS模块来使用，不过有时候也需要在客户端使用。我发现目前还没有引擎能满足这一需求，因为大多数引擎都是基于NodeJS运行环境的，从而很难移植到浏览器运行。我需要一个小巧且用纯JavaScript写的引擎。恰好[**John Resig**](http://ejohn.org/)的[**这篇文章**](http://ejohn.org/blog/javascript-micro-templating/)中提出的引擎满足我的需求。我对它稍作修改，并减缩到20行代码。研究这段脚本的原理是很有意思的事情。本文中我会一步一步重构这个引擎，以便读者能够理解来自John的绝妙idea。



首先，我们的模板引擎应该长这样：
```js
var TemplateEngine = function(tpl, data) {
    // magic here ...
}
var template = '<p>Hello, my name is <%name%>. I\'m <%age%> years old.</p>';
console.log(TemplateEngine(template, {
    name: "Krasimir",
    age: 29
}));
```
一个简单的函数，输入参数是*tpl*模板和*data*对象。可以猜到，最终我们期望得到的结果应该是：
```json
<p>Hello, my name is Krasimir. I'm 29 years old.</p>
```
首先我们需要获得模板中的动态片段，然后用传入引擎中的真实数据替换它们。我们可以用正则表达式来实现，这不是我的强项，所以欢迎指正并提出更好的正则表达式。
```js
var re = /<%([^%>]+)?%>/g;
```
这样，我们会捕获所有以<%开头，以%>结尾的的片段。标志位*g*表示获取所有的匹配项。接受正则表达式的方法有很多，这里我们需要的是一个元素是字符串的数组，这正是[*exec*](http://www.w3schools.com/jsref/jsref_regexp_exec.asp)能干的事情。
```js
var re = /<%([^%>]+)?%>/g;
var match = re.exec(tpl);
```
用*console.log*将*match*变量打印出来，我们会得到：
```js
[
    "<%name%>",
    " name ", 
    index: 21,
    input: "<p>Hello, my name is <%name%>. I\'m <%age%> years old.</p>"
]
```
现在，我们拿到数据了，但是如上所示，返回的数组仅有一个元素，而我们需要处理所有的匹配项。因此，我们要在上述代码的外面加一个*while*循环。
```js
var re = /<%([^%>]+)?%>/g, match;
while(match = re.exec(tpl)) {
    console.log(match);
}
```
运行上面的代码，可以同时得到<%name%>和<%age%>。

现在事情开始变得有趣了。我们需要将传入函数的真实数据来替换模板中的占位符。最简单的方法是对模板应用*.replace*方法。可以这样写：
```js
var TemplateEngine = function(tpl, data) {
    var re = /<%([^%>]+)?%>/g, match;
    while(match = re.exec(tpl)) {
        tpl = tpl.replace(match[0], data[match[1]])
    }
    return tpl;
}
```
OK, 这有用，但当然还不够好。我们现在传入的是最简单的对象，所以可以用data["property"]的方式来取值。但是在实际应用中，我们可能会遇到复杂的嵌套对象。例如，将我们的数据改为：
```js
{
    name: "Krasimir Tsonev",
    profile: { age: 29 }
}
```
现在我们的引擎失效了，因为当输入<%profile.age%>时，我们会得到data["profile.age"]，这个值实际上是*undefined*。因此，我们需要修改引擎的实现。在这种情况下*.replace*方法无法胜任。最好的方式是在<%和%>之间放置JavaScript代码，最好能够根据传入的数据来执行。例如：
```js
var template = '<p>Hello, my name is <%this.name%>. I\'m <%this.profile.age%> years old.</p>';
```
该怎么实现呢？John用了*new Function*语法，也即以字符串为参数来创建函数。我们先看一个简单的例子：
```js
var fn = new Function("arg", "console.log(arg + 1);");
fn(2); // outputs 3
```
fn实际上是一个接收一个参数的函数，它的函数体是console.log(arg+1)；换句话说，上述代码等同于：
```js
var fn = function(arg) {
    console.log(arg + 1);
}
fn(2); // outputs 3
```
通过这种方式，我们可以通过简单字符串来定义一个函数的参数和函数体。这正好满足我们的需求。但是在定义这样一个函数之前，我们需要构建函数的函数体。函数最终应返回编译好的模板。用之前的例子的话，编译好的模板应该是这样的形式：
```js
return 
"<p>Hello, my name is " + 
this.name + 
". I\'m " + 
this.profile.age + 
" years old.</p>";
```
我们需要将模板分成普通文本和有意义的JavaScript代码。如上所示，我们可以通过简单的拼接来得到想要的结果。但是，这种方法不能100%满足要求。因为我们传入的可执行的JavaScript代码可能会做循环，例如：
```js
var template = 
'My skills:' + 
'<%for(var index in this.skills) {%>' + 
'<a href=""><%this.skills[index]%></a>' +
'<%}%>';
```
如果用拼接，结果会是这样：
```js
return
'My skills:' + 
for(var index in this.skills) { +
'<a href="">' + 
this.skills[index] +
'</a>' +
}
```
毫无疑问，这肯定会报错。因此我决定采用John的文章中所用的方法：将所有的字符串片段存入一个数组中，最后再将数组的元素用join方法拼接起来。
```js
var r = [];
r.push('My skills:'); 
for(var index in this.skills) {
r.push('<a href="">');
r.push(this.skills[index]);
r.push('</a>');
}
return r.join('');
```
下一步，我们需要收集自定义函数的不同行。我们已经从模板中获得了一些信息。我们知道占位符的内容及其位置。所以通过使用一个辅助变量（*cursor*）我们就能能够得到预期的结果。
```js
var TemplateEngine = function(tpl, data) {
    var re = /<%([^%>]+)?%>/g,
        code = 'var r=[];\n',
        cursor = 0, match;
    var add = function(line) {
        code += 'r.push("' + line.replace(/"/g, '\\"') + '");\n';
    }
    while(match = re.exec(tpl)) {
        add(tpl.slice(cursor, match.index));
        add(match[1]);
        cursor = match.index + match[0].length;
    }
    add(tpl.substr(cursor, tpl.length - cursor));
    code += 'return r.join("");'; // <-- return the result
    console.log(code);
    return tpl;
}
var template = '<p>Hello, my name is <%this.name%>. I\'m <%this.profile.age%> years old.</p>';
console.log(TemplateEngine(template, {
    name: "Krasimir Tsonev",
    profile: { age: 29 }
}));
```
变量*code*用于保存函数的函数体。它以数组的定义开始，而*cursor*表示现在在模板中所处的位置。我们需要这样一个变量来遍历整个字符串并跳过数据片段。这里使用了一个*add*函数，它的作用是将代码行添加到*code*变量的末尾。这里有一个坑要注意：我们需要对双引号转义，否则生成的脚本会是非法的。运行整个实例，我们可以在控制台看到：
```js
var r=[];
r.push("<p>Hello, my name is ");
r.push("this.name");
r.push(". I'm ");
r.push("this.profile.age");
return r.join("");
```
呃... 与我们预期的不一致。这里的*this.name*和*this.profile*不应该加引号。对*add*方法做一点修改可以解决这个bug：
```js
var add = function(line, js) {
    js? code += 'r.push(' + line + ');\n' :
        code += 'r.push("' + line.replace(/"/g, '\\"') + '");\n';
}
var match;
while(match = re.exec(tpl)) {
    add(tpl.slice(cursor, match.index));
    add(match[1], true); // <-- say that this is actually valid js
    cursor = match.index + match[0].length;
}
```
传入占位符的内容的同时传入一个布尔变量（表示传入的字符串是否是合法的js代码）。现在可以生成正确的函数体了。
```js
var r=[];
r.push("<p>Hello, my name is ");
r.push(this.name);
r.push(". I'm ");
r.push(this.profile.age);
return r.join("");
```
现在我们要做的是创建这个函数并执行它，在模板引擎的末尾，我们不返回*tpl*，而是返回这个函数：
```js
return new Function(code.replace(/[\r\t\n]/g, '')).apply(data);
```
我们甚至不需要给这个函数传任何参数，我们用*apply*方法来调用它。它会自动设置作用域，因此我们用的*this.name*可以生效，这里的*this*实际上指向传入的data。

我们马上就要完成了。还有最后一件事，我们需要支持更复杂的操作，如：if/else语句和循环。仍用上面都的例子并应用目前为止的代码。
```js
var template = 
'My skills:' + 
'<%for(var index in this.skills) {%>' + 
'<a href="#"><%this.skills[index]%></a>' +
'<%}%>';
console.log(TemplateEngine(template, {
    skills: ["js", "html", "css"]
}));
```
结果会报错*Uncaught SyntaxError: Unexpected token for*。通过调试并输出*code*变量，我们就能发现问题所在。
```js
var r=[];
r.push("My skills:");
r.push(for(var index in this.skills) {);
r.push("<a href=\"\">");
r.push(this.skills[index]);
r.push("</a>");
r.push(});
r.push("");
return r.join("");
```
包含*for*循环的代码行不应该push到数组中，而应该放在脚本内执行。因此我们需要在给*code*添加内容之前多做一步检查。
```js
var re = /<%([^%>]+)?%>/g,
    reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
    code = 'var r=[];\n',
    cursor = 0;
var add = function(line, js) {
    js? code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n' :
        code += 'r.push("' + line.replace(/"/g, '\\"') + '");\n';
}
```
引入了一个新的正则表达式，它告诉我们如果js代码以*if*、*for*、*else*、*switch*、*case*、*break*、*{*或*}*开始的话，则单纯的将这一行加到*code*末尾，否则则在外面包一层push语句。结果如下：
```js
var r=[];
r.push("My skills:");
for(var index in this.skills) {
r.push("<a href=\"#\">");
r.push(this.skills[index]);
r.push("</a>");
}
r.push("");
return r.join("");
```
现在，所有模板都能正确编译了。
```js
My skills:<a href="#">js</a><a href="#">html</a><a href="#">css</a>
```
实际上最后一步的修正使我们的引擎变得更加强大。我们可以直接在模板中使用复杂的逻辑。例如：
```js
var template = 
'My skills:' + 
'<%if(this.showSkills) {%>' +
    '<%for(var index in this.skills) {%>' + 
    '<a href="#"><%this.skills[index]%></a>' +
    '<%}%>' +
'<%} else {%>' +
    '<p>none</p>' +
'<%}%>';
console.log(TemplateEngine(template, {
    skills: ["js", "html", "css"],
    showSkills: true
}));
```
我对代码做了一些细小的优化，[最终版](/assets/demo/TemplateEngine.js)如下所示：
```js
var TemplateEngine = function(html, options) {
    var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
    var add = function(line, js) {
        js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    }
    while(match = re.exec(html)) {
        add(html.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(html.substr(cursor, html.length - cursor));
    code += 'return r.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
}
```
它仅有15行！！！
