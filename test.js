class obj {
    static n = 1;
    a () {
  	    console.log('a')
        console.log()
    }
  
    b () {
        this.a()
        console.log('b')
        obj.c()
        console.log()
    }

    static c () {
        console.log(obj.n)
        console.log()
        this.n++
    }
}

let o = new obj()
o.a()
o.b()
// o.c()
let oo = new obj()
// oo.c()


// obj.c()
// obj.c()
console.log(obj.n)