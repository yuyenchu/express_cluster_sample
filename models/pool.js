import mysql from 'mysql2';
import config from 'config';

const MS = config.get('mysql');

// create mysql connection pool
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
    const { query, fields } = statement;
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

const Pool = { pool, query, queryTransaction };
export default Pool;