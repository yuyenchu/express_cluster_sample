import express      from 'express';
import rateLimit    from 'express-rate-limit';
import session      from 'express-session';
import chokidar     from 'chokidar';
import compression  from 'compression';
import cors         from 'cors';
import helmet       from 'helmet';
import moment       from 'moment';
import morgan       from 'morgan';
import mysql        from 'mysql2';
import fetch        from 'node-fetch';
import path         from 'path';
import redis        from 'redis';
import rfs          from 'rotating-file-stream';
import momentDurationFormatSetup from "moment-duration-format";
import { createLightship }  from 'lightship';  
import { fileURLToPath }    from 'url';
import { default as RedisStoreSession } from "connect-redis"
import { default as RedisStoreRate }    from "rate-limit-redis";

var app = express();

// reading configurations from config directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env['NODE_CONFIG_DIR'] = path.join(__dirname, 'config');
import config from 'config';

const PORT      = config.get('port');
const MS        = config.get('mysql');
const REDIS     = config.get('redis');
const SESSION   = config.get('session');
const RATE_LIMIT= config.get('rateLimit');
const USE_SSL   = config.get('useSSL');
const SSL_KEY   = config.get('sslKey');
const SSL_CERT  = config.get('sslCert');
const SSL_CHAIN = config.get('sslChain');
const UTC_OFFSET  = config.get('utcOffset');
const RTFS_ROTATE = config.get('rtfsRotate');

// https server
var server = app;
if (USE_SSL) {
    const https = require('https');
    function readCertsSync() {
        return {
            ...(fs.existsSync(SSL_KEY)   && {key:  fs.readFileSync(SSL_KEY, 'utf8')}),
            ...(fs.existsSync(SSL_CERT)  && {cert: fs.readFileSync(SSL_CERT, 'utf8')}),
            ...(fs.existsSync(SSL_CHAIN) && {ca:   fs.readFileSync(SSL_CHAIN, 'utf8')}),
        }
    }

    server = https.createServer(readCertsSync(), app);

    let updateStat = {
        [path.resolve(SSL_KEY)]:   false,
        [path.resolve(SSL_CERT)]:  false,
        [path.resolve(SSL_CHAIN)]: false,
    }
    chokidar
        .watch(Object.keys(updateStat), { 
            awaitWriteFinish: true 
        })
        .on('change', (p) => {
            updateStat[path.resolve(p)] = true;
            if (Object.values(updateStat).every(Boolean)) {
                Object.keys(updateStat).forEach((k) => updateStat[k] = false);
                server.setSecureContext(readCertsSync());
            }
        });
}

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

async function getSQL(statement, data) {
    const { query, fields } = statement;
    const input = Array.isArray(data)?data:fields.map(i=>data[i]);

    return new Promise((resolve, reject)=>{ 
        pool.getConnection((err, connection) => {
            if (err) return reject(err);
            connection.query(query, input, function (error, results, fields) {
                if (error)  return reject(error);
                connection.commit(function(err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(results);
                });
            });
        });
    });
}

// create redis client connection
const redisClient = redis.createClient({
    host: REDIS.host,
    port: REDIS.port,
    password: REDIS.password
});
redisClient.on('error', function (err) {
    console.log(`[ERROR] Could not establish a connection with redis: ${err}`);
});
redisClient.on('connect', function (err) {
    console.log('[INFO] Connected to redis successfully');
});
await redisClient.connect();

// create a rotating write stream for logger
let accessLogStream = rfs.createStream('access.log', {
    interval: RTFS_ROTATE,
    path: path.join(__dirname, 'log')
})

// compress middleware filter
const shouldCompress = (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res);
}

// app middleware setup
// using ejs views for dynamic pages
app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs');
// using HTTP request logger middleware
app.use(morgan('short'));
app.use(morgan(':remote-addr - :remote-user [:date[clf]] \
":method :url HTTP/:http-version" :status :res[content-length] \
":referrer" ":user-agent" - :response-time ms',
  {"stream": accessLogStream})
);
// using rate limit middleware
app.use(rateLimit({
    // config
    windowMs: RATE_LIMIT.window,
    max: RATE_LIMIT.maxReq, // Limit each IP requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: `You have exceeded the ${RATE_LIMIT.maxReq} requests in \
${moment.duration(RATE_LIMIT.window, "seconds").format("h [hrs], m [min], ss [s]",{trim: "both mid"})} limit!`, 
    store: new RedisStoreRate({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
}));
// using secure HTTP headers middleware
app.use(helmet());
// using CORS middleware (allowing all CORS)
app.use(cors());
// setting express session for user login/logout
app.use(session({
    store: new RedisStoreSession({ client: redisClient }),
    secret: SESSION.secret,
    resave: SESSION.resave,
    saveUninitialized: SESSION.saveUninit,
    cookie: {
        secure: USE_SSL, // if true only transmit cookie over https
        httpOnly: false, // if true prevent client side JS from reading the cookie 
        maxAge: SESSION.maxAge // session max age in miliseconds
    }
}));
// setting static directory
app.use(express.static(path.join(__dirname, 'public')));
// setting cache control to do not allow any disk cache 
// to prevent reload page without login
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
// using parsing middlewares for urlencoded and json payloads 
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// using compression middleware to compress response if client accept
app.use(compression({ filter: shouldCompress }));

// get methods
// send simple text, url: http://localhost:3000
app.get('/', function (req, res) {res.send("Hello!")}); 
// using input params, url: http://localhost:3000/id/ENTER_A_NUMBER
app.get('/id/:id', function (req, res) {res.send("Your ID is "+req.params.id)}); 
// send file, url: http://localhost:3000/image
app.get('/image', function (req, res) {res.sendFile(path.join(__dirname,'/public/images/trollface.png'))}); 
// inject and render view, url: http://localhost:3000/user
app.get('/user', function(req, res) {
    res.render('index',{username:req.session.username, message:req.session.message});
});

// post methods
// collecting username and set message, triggered by /user
app.post('/login', function(req, res) {
    var username = req.body.username.trim();
	var password = req.body.password.trim();
    if(req.session.loggedin) {
        req.session.message = "you've already logged in...";
    } else if (username && password==="123"){
        req.session.loggedin = true;
        req.session.username = username;
        req.session.message = "you're now logged in";
    } else {
        req.session.message = "wrong password";
    }
    res.redirect('/user');
}); 
// removing username and set message, triggered by /user
app.post('/logout', function(req, res) {
    if(req.session.loggedin) {
        req.session.loggedin = false;
        req.session.username = "";
        req.session.message = "you're now logged out";
    } else{
        req.session.message = "you haven't logged in yet...";
    }
    res.redirect('/user');
}); 

// setup lightship for graceful shutdown and health check
const lightship = await createLightship();
let connections = new Set();

server.on('connection', function(conn) {
    connections.add(conn);
    conn.on('close', function() {
        connections.delete(conn);
    });
});

lightship.registerShutdownHandler(() => {
    console.log('[INFO] graceful shutdown');
    server.close();
    pool.end();
    redisClient.end(true);
    connections.forEach((c) => c.destroy());
});

// start server on port specified in config
// demo functions with await
server.listen(PORT, async function () {
    // moment formating current datetime in mysql datetime style
    const time = moment().utcOffset(UTC_OFFSET).format('YYYY-MM-DD HH:mm:ss');
    // http calls with fetch and abort if taking too long
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000);

    try {
        const res = await fetch('http://jsonip.com', { signal: controller.signal });
        const data = await res.json();
        console.log(`[START] app listening on ${data.ip}:${PORT} (${time})`);
    } catch(err) {
        console.log(`[START] app listening on port ${PORT} (${time})`);
        console.error(`[ERROR] (fetch) ${err}`);
    }

    try {
        const sqlRes = await getSQL(MS.statements.getCount, null);
        console.log(`[INFO] current user in databse: ${sqlRes?.[0]?.count??'Unknown'}`);
    } catch(err) {
        console.error(`[ERROR] (mysql) ${err}`);
    }

    lightship.signalReady();
    if(process.send) process.send('ready');
})
.on('error', () => {
    lightship.shutdown();
});
    
////////////////////////////////////////////////////////////////
// // demo functions with callbacks pipline
// server.listen(PORT, function () {
//     // moment formating current datetime in mysql datetime style
//     const time = moment().utcOffset(UTC_OFFSET).format('YYYY-MM-DD HH:mm:ss');

//     console.log(`[START] app listening on port ${PORT} (${time})`);
//     getSQL(MS.statements.getCount, null)
//     .then((res) => {
//         console.log(`[INFO] current user in databse: ${res[0].count}`);
//     })
//     .catch((err) => {
//         console.error(err);
//     });
    

//     // http calls with fetch and abort if taking too long
//     const url = 'http://jsonip.com';
//     const controller = new AbortController();
//     setTimeout(() => controller.abort(), 1000);

//     fetch(url, { signa: controller.signal })
//         .then(res => {
//             console.log(`[INFO] fetch public ip from ${url} => (${res.status})[\
// method='${res.headers.get('access-control-allow-methods')}', \
// content-type='${res.headers.get('content-type')}', \
// date='${res.headers.get('date')}'] `);
//             return res.json()
//         })
//         .then(data => {
//             console.log(`\tresult=${JSON.stringify(data)}`);
//         })
//         .catch((err) => {
//             console.error(err);
//         });
//     lightship.signalReady();
//     if(process.send) process.send('ready')
// })
// .on('error', () => {
//     lightship.shutdown();
// });