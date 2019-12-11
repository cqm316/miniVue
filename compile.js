const reg = /\{\{([^}]+)\}\}/g;

class Compile {
    constructor(el,vm){
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        if(this.el){
            let fragment = this.node2Fragment(this.el);
            this.compile(fragment);
            this.el.appendChild(fragment);
        }
    }
    // 判断是否是标签元素
    isElementNode(node){
        return node.nodeType === 1;
    }
    // 是否是指令
    isDirective(name){
        return name.includes('v-');
    }
    // 核心写法
    compileElement(node){
        let attrs = node.attributes;
        Array.from(attrs).forEach(attr => {
            let attrName = attr.name;
            if(this.isDirective(attrName)){
                let expr = attr.value;
                let [,type] = attrName.split('-');
                CompileUtil[type](node, this.vm, expr);
            }
        })
    }
    compileText(node){
        // {{}}
        let expr = node.textContent;
        if(reg.test(expr)){
            CompileUtil['text'](node, this.vm, expr);
        }
    }
    compile(fragment){
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node=>{
            if(this.isElementNode(node)){
                this.compileElement(node);
                this.compile(node);
            }else {
                this.compileText(node);
            }
        })
    }
    node2Fragment(el){
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild){
            fragment.appendChild(firstChild);
        }
        return fragment;
    }
}

CompileUtil = {
    // 获取实例上对应的数据
    getVal(vm, expr){
        expr = expr.split('.');  // vm.$data.a.b
        return expr.reduce((pre,next)=>{
            return pre[next];
        }, vm.$data);
    },
    getTextVal(vm, expr) {
        return expr.replace(reg,(...arguments)=>{
            return this.getVal(vm, arguments[1]);
        });
    },
    text(node, vm, expr){
        let updateFn = this.update['textUpdater'];
        let value = this.getTextVal(vm, expr);
        expr.replace(reg, (...arguments)=>{
            new Watcher(vm, arguments[1], (newValue)=>{
                // 如果数据变化了，更新文本信息
                updateFn && updateFn(node, this.getTextVal(vm, expr));
            })
        });
        updateFn && updateFn(node, value);
    },
    setVal(vm, expr, value){
        expr = expr.split('.');
        return expr.reduce((pre, next, currentIndex) => {
            if(currentIndex === expr.length - 1){
                return pre[next] = value;
            }
            return pre[next];
        },vm.$data)
    },
    model(node, vm, expr) {
        // 输入框处理
        let updataFn = this.update['modelUpdater'];

        new Watcher(vm, expr, ()=>{
            updataFn && updataFn(node, this.getVal(vm,expr))
        });
        node.addEventListener('input',(e)=>{
            let newValue = e.target.value;
            this.setVal(vm, expr, newValue);
        });

        updataFn && updataFn(node, this.getVal(vm, expr));
    },
    update: {
        // 文本处理
        textUpdater(node, value){
            node.textContent = value
        },
        // 输入框更新
        modelUpdater(node, value) {
            node.value = value;
        }
    }
}
