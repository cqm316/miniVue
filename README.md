### MVVM

M -> model数据模型; V -> view视图层;  VM -> ViewModel视图模型

数据变化驱动视图更新

### vue类的实现

在vue的MVVM设计中，包括这几个角色：Compile(模板编译)、Observer(数据劫持)、Watcher(数据监听)、Dep(发布订阅/收集依赖)

对外暴露一个Vue 的构造函数，在使用的时候，new 一个Vue实例，然后传入options参数，类型为一个对象，包括当前 Vue 实例的作用域 el、
模板绑定的数据 data 等等。

```javascript
// 文件：vue.js
class Vue {
    constructor(options) {
        // 先把 el 和 data 挂在 MVVM 实例上
        this.$el = options.el;
        this.$data = options.data;

        // 如果有要编译的模板就开始编译
        if (this.$el) {
            // 数据劫持，就是把对象所有的属性添加 get 和 set
            new Observer(this.$data);

            // 用数据和元素进行编译
            new Compile(this.el, this);
        }
    }
}
```

### 模板编译 Compile 类的实现

Compile 类在创建实例的时候需要传入两个参数，第一个参数是当前 Vue 实例作用的根节点，第二个参数就是 
Vue 实例，之所以传入 Vue 的实例是为了更方便的获取 Vue 实例上的属性。

在 Compile 类中，我们会尽量的把一些公共的逻辑抽取出来进行最大限度的复用，避免冗余代码，提高维护性和
扩展性，我们把 Compile 类抽取出的实例方法主要分为两大类，辅助方法和核心方法，在代码中用注释标明。

compile编译模板：

- 解析根节点内的 Dom 结构

v-model/v-bind编译元素 -> 更新元素方法 -> 创建watcher -> 回调watcher的upate方法

- 文档碎片中的结构

{{name}}编译文本 -> 更新文本方法 -> 创建watcher -> 回调watcher的upate方法

### 数据劫持 Observer 类的实现

在实现 Vue 类的时候就创建了这个类的实例，当时传入的参数是 Vue 实例的 data 属性，在 Vue 中把数据通过 
Object.defineProperty 挂到了实例上，并添加了 getter 和 setter，其实 Observer 类主要目的就是给 data 内的所有层级的
数据都进行这样的操作。

在 get 中就可以将这个 watcher 
添加到 Dep 的 subs 数组中进行统一管理，因为在代码中获取 data 中的值操作比较多，会经常触发 get，我们又要保证 watcher 不会被重复
添加，所以在 Watcher 类中，获取旧值并保存后，立即将 Dep.target 赋值为 null，并且在触发 get 时对 Dep.target 进行了短路操作，
存在才调用 Dep 的 addSub 进行添加。

而 data 中的值被更改时，会触发 set，在 set 中做了性能优化，即判断重新赋的值与旧值是否相等，如果相等就不重新渲染页面，不等的情况有
两种，如果原来这个被改变的值是基本数据类型没什么影响，如果是引用类型，我们需要对这个引用类型内部的数据进行劫持，因此递归调用了 observe，
最后调用 Dep 的 notify 方法进行通知，执行 notify 就会执行 subs 中所有被管理的 watcher 的 update，就会执行创建 watcher 时的传
入的 callback，就会更新页面。


### 发布订阅 Dep 类的实现

其实发布订阅说白了就是把要执行的函数统一存储在一个数组中管理，当达到某个执行条件时，循环这个数组并执行每一个成员。

在 Dep 类中只有一个属性，就是一个名为 subs 的数组，用来管理每一个 watcher，即 Watcher 类的实例，而 addSub 就是用来将 
watcher 添加到 subs 数组中的，我们看到 notify 方法就解决了上面的一个疑问，Watcher 类的 update 方法是怎么执行的，就是
这样循环执行的。


### 观察者 Watcher 类的实现

Watcher 实例，传入了三个参数，即 Vue 的实例、模板绑定数据的变量名 exp 和一个 callback，这个 callback 内部逻辑是为了更新数据到 Dom，
所以我们的 Watcher 类内部要做的事情就清晰了，获取更改前的值存储起来，并创建一个 update 实例方法，在值被更改时去执行实例的 callback 以达到视图的更新。

### 总结

实现双向数据绑定，实时保证 View 层与 Model 层的数据同步，并可以让我们在开发时基于数据编程，而最少的操作 Dom，这样大大提高了页面渲染的性能，
也可以使我们把更多的精力用于业务逻辑的开发上。
