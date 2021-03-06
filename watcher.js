// 观察者的目的就是给需要变化的那个元素增加一个观察者，当数据变化后执行对象的方法
class Watcher {
    constructor(vm, expr, cb){
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        // 先获取老的值
        this.value = this.get();
    }
    getVal(vm, expr){
        expr = expr.split('.'); // vm.$data.a
        return expr.reduce((pre,next)=>{
            return pre[next];
        }, vm.$data)
    }
    get(){
        Dep.target = this;
        let value = this.getVal(this.vm, this.expr);
        Dep.target = null;
        return value;
    }
    update(){
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if(newValue !== oldValue){
            this.cb(newValue);
        }
    }
}
