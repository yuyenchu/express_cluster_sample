<<<<<<< HEAD
import Joi from 'joi';
=======
>>>>>>> 2258311 (first commit)
import mysql from 'mysql2';
import config from 'config';

const MS = config.get('mysql');

<<<<<<< HEAD
const STATEMENT_SCHEMA = Joi.object({    
    query: Joi.string().required(),
    fields: Joi.array().items(Joi.string()).required()
});

// create mysql connection pool
=======
>>>>>>> 2258311 (first commit)
const pool = mysql.createPool({
    host     : MS.host,
    user     : MS.user,
    password : MS.password,
    database : MS.database,
    multipleStatements: true,
    waitForConnections : true,
    connectionLimit : MS.connLimit
});

async function query(statement, data, conn) {
<<<<<<< HEAD
    const { query, fields } = await STATEMENT_SCHEMA.validateAsync(statement);
=======
    const { query, fields } = statement;
>>>>>>> 2258311 (first commit)
    const input = Array.isArray(data)?data:fields.map(i=>data[i]);

    if (conn) {
        return conn.promise().query(query, input);
    } else {
        return pool.promise().query(query, input);
    }
}

async function queryTransaction(statements, dataArr) {
    if (!Array.isArray(statements) || !Array.isArray(dataArr)) {
        throw new Error("statement or data is not array");
    }
    if (statements.length !== dataArr.length) {
        throw new Error("statements and data length doesn't match");
    }

    return pool.getConnection(function(err, conn) {
        return Promise.all(statements.map(async(val,idx) => {
            let res =  query(val, dataArr[idx], conn);
            return res;
        })).then(async(results)=>{
            await conn.promise().commit();
            await pool.promise().releaseConnection(conn);
            return results;
        }).catch(async(err)=>{
            await conn.promise.rollback();
            return Promise.reject(err);
        })
    });
}

<<<<<<< HEAD
// async function getSQL(statement, data) {
//     const { query, fields } = statement;
//     const input = Array.isArray(data)?data:fields.map(i=>data[i]);

//     return new Promise((resolve, reject)=>{ 
//         pool.getConnection((err, connection) => {
//             if (err) return reject(err);
//             connection.query(query, input, function (error, results, fields) {
//                 if (error)  return reject(error);
//                 connection.commit(function(err) {
//                     if (err) {
//                         return reject(err);
//                     }
//                     return resolve(results);
//                 });
//             });
//         });
//     });
// }
=======
>>>>>>> 2258311 (first commit)

// pool.on('acquire', function (connection) {
//     console.log('Connection %d acquired', connection.threadId);
// });

// pool.on('release', function (connection) {
//     console.log('Connection %d released', connection.threadId);
// });


// pool.connect((e) => {
//     if (e) {
//         console.log("conection failed! error: " + e.message);
//         return;
//     }
//     console.log("conection success");
// });

<<<<<<< HEAD
const Pool = { pool, query, queryTransaction };
export default Pool;
=======
module.exports = pool;
>>>>>>> 2258311 (first commit)
