import express      from 'express';
import rateLimit    from 'express-rate-limit';
import slowDown     from 'express-slow-down';
import session      from 'express-session';
import chokidar     from 'chokidar';
import compression  from 'compression';
import cookieParser from 'cookie-parser';
import cors         from 'cors';
import fs           from 'fs';    
import helmet       from 'helmet';
import moment       from 'moment';
import morgan       from 'morgan';
import fetch        from 'node-fetch';
import path         from 'path';
import rfs          from 'rotating-file-stream';
import favicon      from 'serve-favicon';
// plugin for moment, only need import
import momentDurationFormatSetup from "moment-duration-format"; 
import { unless }           from 'express-unless';
import { createLightship }  from 'lightship';  
import { fileURLToPath }    from 'url';
import { default as RedisStoreSession } from 'connect-redis';
import { default as RedisStoreRate }    from 'rate-limit-redis';

// set environment variable
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env['NODE_CONFIG_DIR'] = path.join(__dirname, 'config');

// import routes
import apiRoutes    from './routers/api/apiRouter.js';
import authRoutes   from './routers/auth/authRouter.js';

// import model for general use
import generalModel from './models/generalModel.js';
import redisClient  from './models/redis.js';

// import custom middleware
import { renewAccessToken } from './middlware/jwtAuth.js';

// import util 
import { statusCodeToReason } from './utils/statusCode.js'

// reading configurations from config directory
import config from 'config';

const PORT      = config.get('port');
const CSP       = config.get('csp');
const SESSION   = config.get('session');
const RATE_LIMIT= config.get('rateLimit');
const SLOW_DOWN = config.get('slowDown');
const USE_SSL   = config.get('useSSL');
const SSL_KEY   = config.get('sslKey');
const SSL_CERT  = config.get('sslCert');
const SSL_CHAIN = config.get('sslChain');
const UTC_OFFSET  = config.get('utcOffset');
const RTFS_ROTATE = config.get('rtfsRotate');
const DEFAULT_TIMEOUT = config.get('defaultTimeout');

// express server
var app = express();
var server = app;
if (USE_SSL) {
    const https = await import('https');
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
} else {
    const http = await import('http');
    server = http.createServer(app);
}
server.setTimeout(DEFAULT_TIMEOUT);

// create a rotating write stream for logger
let accessLogStream = rfs.createStream('access.log', {
    interval: RTFS_ROTATE,
    path: path.join(__dirname, 'logs')
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
app.use(morgan(`(${process.env.INSTANCE_ID??process.env.NODE_APP_INSTANCE}):remote-addr - :remote-user [:date[clf]] \
":method :url HTTP/:http-version" :status :res[content-length] \
":referrer" ":user-agent" - :response-time ms`,
  {"stream": accessLogStream})
);
// using secure HTTP headers middleware
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "script-src": [
                "'self'", 
                "'unsafe-inline'",
                ...CSP.scriptSrc,
            ],
            "script-src-attr": [
                "'self'", 
                "'unsafe-inline'",
            ]
        },
    },
}));
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
        httpOnly: true, // if true prevent client side JS from reading the cookie 
        maxAge: SESSION.maxAge // session max age in miliseconds
    }
}));
// using rate limit middleware for api routes
app.use('/api',rateLimit({
    // rate limit config
    windowMs: RATE_LIMIT.window, // window time in milliseconds
    max: RATE_LIMIT.maxReq, // Limit each IP requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: `You have exceeded the ${RATE_LIMIT.maxReq} requests in \
${moment.duration(RATE_LIMIT.window, "milliseconds").format("h [hrs], m [min], ss [s]",{trim: "both mid"})} limit!`, 
    store: new RedisStoreRate({
        client: redisClient,
        prefix: 'rl:',
        sendCommand: async(...args) => redisClient.sendCommand(args),
    }),
}));
// using slow down middleware except api routes and static resources
const slowDownMiddleware = slowDown({
    // slow down config
    windowMs: SLOW_DOWN.window, // window time in milliseconds
    delayAfter: SLOW_DOWN.delayAfter, // start delay after each IP requests per `window`
    delayMs: SLOW_DOWN.delay, 
    maxDelayMs: SLOW_DOWN.maxDelay,
    skipFailedRequests: SLOW_DOWN.skipFail,
    skipSuccessfulRequests: SLOW_DOWN.skipSuccess,
    onLimitReached: (req, res, options) => {
        const username = req?.session?.username??"";
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log(`[INFO] ${ip}/${username} delay ${req.slowDown.delay}ms`)
    },
    store: new RedisStoreRate({
        client: redisClient,
        prefix: 'sd:',
        sendCommand: async(...args) => redisClient.sendCommand(args),
    }),
});
slowDownMiddleware.unless = unless;
app.use(slowDownMiddleware.unless({
    path: ['/api'],
    ext: [".png", ".jpg", ".css", ".js", ".ico"]
}));
// setting static directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// setting cache control to do not allow any disk cache 
// to prevent reload page without login
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
// using parsing middlewares for urlencoded and json payloads 
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
// using compression middleware to compress response if client accept
app.use(compression({ filter: shouldCompress }));

// express method showcase
// redirect
app.get('/', function (req, res) {res.redirect('/home')}); 
// params and send text
app.get('/id/:id', function (req, res) {res.send("Your ID is "+req.params.id)}); 
// send file
app.get('/image', function (req, res) {res.sendFile(path.join(__dirname,'/public/images/trollface.png'))}); 

// view routes
app.get('/home', async function(req, res) {
    const username = req.session?.username?.trim();
    if(username) {
        let data = await generalModel.getAllMemo();
        res.render('index',{login: true, message: `All latest memo, total ${data.length} memos`, data});
    } else {
        let data = await generalModel.getThreeMemo();
        res.render('index',{login: false, message: 'Latest 3 memo, login to view more', data});
    }
});
app.get('/memo', renewAccessToken, async function(req, res) {
    const username = req.session?.username?.trim();
    if(username) {
        let data = await generalModel.getUserMemo(username);
        res.render('memo',{login: true, message:`Welcome ${username}, here are your memos`, data});
    } else {
        res.render('memo',{login: false, message:'Login to create memo', data:[]});
    }
});
app.get('/login', function(req, res) {
    const username = req.session?.username?.trim();
    if(username) {
        res.redirect('/memo');
    } else {
        res.render('login',{message:'', messageColor:'black'});
    }
});

// auth routes
app.use('/auth', authRoutes);
// api routes
app.use('/api', apiRoutes);

app.use(function(req, res, next) {
    const username = req?.session?.username;
    res.status(404);
  
    // respond with html page
    if (req.accepts('html')) {
        return res.render('error', {login: username!==undefined, status: 404, error: {message:`${req.url} not found`}});
    }
  
    // respond with json
    if (req.accepts('json')) {
        return res.json({ error: 'Not found' });
    }
  
    // default to plain-text. send()
    res.type('txt').send('Not found');
});

app.use(function(err, req, res, next){
    // we may use properties of the error object
    // here and next(err) appropriately, or if
    // we possibly recovered from the error, simply next().
    const username = req?.session?.username;
    console.log(statusCodeToReason[err.status])
    const status = statusCodeToReason[err.status] ? err.status : 500;
    const error = ((app.get('env')==='development')&&err.message) ? err : { message: statusCodeToReason[status] };
    res.status(status);
    
    if (req.accepts('html')) {
        return res.render('error', {login: username!==undefined, status, error});
    }

    if (req.accepts('json')) {
        return res.json({ error });
    }
  
    res.type('txt').send('Server Error');
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
        const userCount = await generalModel.getUserCount();
        console.log(`[INFO] current user in databse: ${userCount??'Unknown'}`);
        // console.log(await generalModel.getAllMemo());
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
//     generalModel.getUserCount()
//     .then((res) => {
//         console.log(`[INFO] current user in databse: ${res}`);
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