---
title: Javascript创建对象的几种方式
comments: true
reward: true
date: 2017-02-09 21:49:42
categories: Frontend
---

> JavaScript作为一门动态性的面向对象的编程语言，其核心思想就是一切皆对象。为了深入理解JS面向对象的编程思想，本文总结了几种常见的创建JS对象的方法，比较了各自的优缺点以及使用场景。

> 参考书籍：《Javascript高级程序设计》（第3版）、《Javascript权威指南》
> 
<!-- more -->

#### 1. 对象字面量
这是创建对象最简单的方式，对象是由若干“名/值”对组成的映射表：
```javascript
var obj = {"name": "obj"; "age": 24};
```

#### 2. 工厂模式
工厂模式是软件工程领域一种广为人知的设计模式，用函数来封装并以特定接口创建对象的细节，实现方式如下：
```javascript
// 在函数内创建对象，给新创建的对象添加属性和方法，并显式得返回。
function createObj(name){
    var obj = new Object();
    obj.name = name;
    obj.getName = function(){
        return this.name;
    };
    return obj;
}
var person = createObj("Test");
person.getName(); //Test
```
函数createObj()能够根据接受的参数来创建一个person对象；可见，工厂模式可以创建多个相似对象，但是我们不能确定通过工厂模式创建的对象的类型。

#### 3. 构造函数模式
构造函数可以创建特定类型（Array、Object）的对象，也可以创建自定义的对象，并为对象定义自定义的属性和方法：
```javascript
//使用原生的构造函数
var arr = new Array();   //创建一个数组对象
var myDate = new Date();    //创建一个date对象
function Person(name, age){
    this.name = name;
    this.age = age;
    this.sayName = function(){
        return this.name;
    };
}
var person1 = new Person("Xiao", 24);  //用自定义的构造函数创建一个对象
```
需要注意的是，自定义的构造函数名一般以大写字母开头。 
使用构造函数创建对象必须使用new操作符，这里new操作符主要做了这几件事：
> 1.  创建一个新对象；
> 2.  把构造函数的this指向新对象；
> 3.  为新对象添加属性和方法；
> 4.  返回这个新对象。

构造函数模式可以创建特定类型的对象实例，但是它的主要缺点是构造函数中的方法要在每个实例上重新创建一遍，但是方法都是Function的实例，所以构造函数的不同实例的同名函数其实是不相等的。

#### 4. 原型模式
我们创建每一个函数都有一个prototype属性，它指向一个对象，该对象包含有特定类型的所有实例共享的属性和方法。也就是说prototype就是通过构造函数创建的对象实例的原型对象。因此，我们可以在原型对象上定义属性和方法，而不必在构造函数中定义：
```javascript
function Person(){}；
Person.prototype.name = "Hanks";
Person.prototype = 24;
Person.prototype.sayName = function(){
    return this.name;
};
var person1 = new Person();
person1.sayName(); // Hanks
var person2 = new Person();
person2.sayName(); //Hanks
person2.name = "Gray"; 
person2.sayName(); //Gray
```
更简单的原型语法： 将原型对象中的所有属性和方法写在一个对象字面量中（相当于重写原型对象）。原型模式的主要问题是：所有实例都会取得相同的默认值，而且更致命的是一个实例修改原型对象的某个属性会在所有实例中体现出来。

#### 5. 构造函数与原型的组合模式
这种方式是创建自定义类型最常见的模式，用构造函数模式定义实例属性，而用原型模式定义共享的属性和方法。这种模式集两者之长，不仅支持传递参数，还最大限度的节省了内存。
```javascript
function Person(name, age){
    this.name = name;
    this.age = age;
};
Person.prototype.sayName = function(){
    return this.name;
};
```

#### 6. 动态原型模式
这种模式将原型的初始化放在构造函数中进行，通过判断某个方法是否已定义来决定是否需要初始化原型：
```javascript
function Person(name, age){
    this.name = name;
    this.age = age;
    //仅在sayName函数未定义的时候（初次调用）才初始化原型对象
    if(typeof sayName != "function"){
        Person.prototype.sayName = function(){
            return this.name;
        };
    }
};
```

#### 7. 寄生构造函数模式
基本思想是创建一个函数，用于封装创建对象的代码，然后再返回新创建的对象，注意与工厂模式的区别。
```javascript
// 在函数内创建对象，给新创建的对象添加属性和方法，并显示的返回。
function Person(name){
    var obj = new Object();
    obj.name = name;
    obj.getName = function(){
        return this.name;
    };
    return obj;
}
//与工厂模式的区别：这里用new操作符创建实例
var person = new Person("Test");
person.getName(); //Test
```
该模式可用来为某些构造函数添加一些额外的方法，但是又不想直接修改原来的构造函数（如不想修改原生的Array构造函数）

#### 8. 稳妥构造函数模式
稳妥对象没有公共属性和方法，构造函数中红不使用this对象，注意与寄生构造函数模式的区别
```javascript
// 在函数内创建对象，给新创建的对象添加属性和方法，并显示的返回。
function Person(name){
    var obj = new Object();
    var name = name;
    obj.getName = function(){
        //不引用this
        return name;
    };
    return obj;
}
//与工厂模式的区别：这里用new操作符创建实例
var person = Person("Test");
person.getName(); //Test
```
除了使用sayName()方法外，没有其他方式可以访问其中的数据成员。

以上8种创建JS对象的方法中，原型与构造函数组合模式和动态原型模式是一定要掌握的，具体使用哪一种模式需要根据具体的项目及要求来选择。