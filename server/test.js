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

// import Joi from 'joi';
// const MS_STATEMENT_SCHEMA = Joi.object({    
//     query: Joi.string().required(),
//     fields: Joi.array().items(Joi.string()).required()
// })

// let statement={
//     query: "UPDATE memos SET `done`=True WHERE `id`=?;",
//     fields: ['id'],
//     a:1
// }

// const { value, error } = MS_STATEMENT_SCHEMA.validate(statement);
// if (error) throw error;
// const value = MS_STATEMENT_SCHEMA.validateAsync(statement);
// await Joi.number().min(2).validateAsync(2);

// import {statusCodeToReason} from './utils/statusCode.js'
// console.log(statusCodeToReason[404])
// console.log(statusCodeToReason[501])
// console.log(statusCodeToReason[401])
// console.log(statusCodeToReason[403])

import winston, { createLogger, format, transports } from 'winston';
import rfs          from 'rotating-file-stream';
const { combine, timestamp, label, prettyPrint, printf } = format;
import {JWTError} from './utils/errors.js'
const logger = winston.createLogger({
    level: 'warn',
    format: combine(
        label({ label: process.env.INSTANCE_ID??process.env.NODE_APP_INSTANCE }),
        timestamp(),
        // prettyPrint(),
        printf(({ level, message, ip, url, label, timestamp }) => {
            if (typeof message.format === 'function') message = message.format();
            return `(${label})${ip} - - [${timestamp}] [${level.toUpperCase()}] ${url} - ${message}`;
        }),
    ),
    transports: [
        new transports.Console({
            stderrLevels:['error']
        }),
        // new winston.transports.File({ filename: 'error.log'}),
        new transports.Stream({
            // filename: 'application-%DATE%.log',
            // datePattern: 'YYYY-MM-DD-HH',
            // zippedArchive: true,
            // maxSize: '20m',
            // maxFiles: '14d',
            stream: rfs.createStream('error_rfs.log', {
                interval: '1d',
                path: '.'
            })
        })
    ],
});

console.log('this is log')
logger.log({level: 'info', message:'this is winston log'})
console.error('this is error')
logger.log({level: 'error', message: new Error('stream errr'), url:'/oops'})
logger.log({level: 'warn', message: new JWTError('expired', 401, 'aer213r', '12r8b'),ip:'::ffff:192.168.0.121',url:'/error'})
logger.log({level: 'warn', message:'warning', field:3})