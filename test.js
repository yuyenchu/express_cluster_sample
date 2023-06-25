// class obj {
//     static n = 1;
//     a () {
//   	    console.log('a')
//         console.log()
//     }
  
//     b () {
//         this.a()
//         console.log('b')
//         obj.c()
//         console.log()
//     }

//     static c () {
//         console.log(obj.n)
//         console.log()
//         this.n++
//     }
// }

// let o = new obj()
// o.a()
// o.b()
// // o.c()
// let oo = new obj()
// // oo.c()


// // obj.c()
// // obj.c()
// console.log(obj.n)

import Joi from 'joi';
const MS_STATEMENT_SCHEMA = Joi.object({    
    query: Joi.string().required(),
    fields: Joi.array().items(Joi.string()).required()
})

let statement={
    query: "UPDATE memos SET `done`=True WHERE `id`=?;",
    fields: ['id'],
    a:1
}

// const { value, error } = MS_STATEMENT_SCHEMA.validate(statement);
// if (error) throw error;
// const value = MS_STATEMENT_SCHEMA.validateAsync(statement);
await Joi.number().min(2).validateAsync(2);
