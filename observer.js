class Observer {
    constructor(data){
        this.observer(data)
    }
    observer(data){
        if(!data || typeof data !== 'object'){
            return;
        }
        Object.keys(data).forEach(key=>{
            this.defineReactive(data,key,data[key]);
            this.observer(data[key]); //深度递归劫持
        })
    }
    defineReactive(obj,key,value){
        let self = this;
        let dep = new Dep();
        Object.defineProperty(obj,key, {
            enumerable: true,
            configurable: true,
            get(){
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newValue){
                if(newValue !== value){
                    // 如果是对象继续劫持
                    self.observer(newValue);
                    value = newValue;
                    dep.notify(); // 通知所有人数据更新了
                }
            }
        })
    }
}

class Dep {
    constructor(){
        // 订阅的数组
        this.subs = []
    }
    addSub(watcher){ // 收集
        this.subs.push(watcher)
    }
    notify(){ // 通知更新
        this.subs.forEach(watch=>watch.update())
    }
}
