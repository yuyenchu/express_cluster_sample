# Config Format
```js
{
    "port": number, // port number the server will listen
    "utcOffset": number, // utc offset for moment
    "useSSL": boolean, // use https server or not
    "sslKey": string, // path to ssl certificate key file
    "sslCert": string, // path to ssl certificate cert file
    "sslChain": string, // path to ssl certificate chain/fullchain file
    "rtfsRotate": string, // interval for rotating file stream logging, see https://www.npmjs.com/package/rotating-file-stream#interval
    "defaultTimeout": number, // default connection timeout in milliseconds
    //* config for mysql database *//
    //* see https://www.npmjs.com/package/mysql2#using-connection-pools for more details */
    "mysql": {
        "host": string, // hostname for mysql database, port default to 3306
        "user": string, // mysql user
        "password" : string, // mysql password
        "database" : string, // mysql db name
        "connLimit": number // max number of concurrent connection to mysql
    },
    //* config for redis database *//
    //* see https://www.npmjs.com/package/ioredis#connect-to-redis for more details */
    "redis": {
        "host": string, // hostname for redis database
        "port": number // port number for redis database
        "password": string // redis password, default to none (NOTE: some middleware requires no password)
    },
    //* config for express session middleware *//
    //* see https://www.npmjs.com/package/express-session#Options for more details */
    "session": {
        "secret": string, // session secret to be used, 256 characters is recommended
        "maxAge": number, // session max age in milliseconds
        "resave": boolean, // force save back to store
        "saveUninit": boolean // force save uninitialized session to sore
    },
    //* config for json web token authorization *//
    //* see https://www.npmjs.com/package/jsonwebtoken#usage for more details */
    "jwt": {
        "secret": string, // jwt signing secret, 256 characters is recommended
        "refreshLength": number, // refresh token length, which will be stored in redis
        "extendAccess": boolean, // automatically issue new access token when expired
        "extendRefresh": boolean, // automatically issue new refresh token when expired
        "accessExpire": number, // access token expire time in seconds
        "refreshExpire": number, // refresh token expire time in seconds, recommended to be longer than session max age
    },
    //* config for rate limit middleware *//
    //* see https://www.npmjs.com/package/express-rate-limit#configuration for more details */
    "rateLimit": {
        "window": number, // time frame for which requests are checked, in milliseconds
        "maxReq": number // maximum number of connections to allow before rate limiting 
    },
    //* config for slow down middleware *//
    //* see https://www.npmjs.com/package/express-slow-down#configuration for more details */
    "slowDown": {
        "window": number, // milliseconds for how long to keep requests records
        "delayAfter": number, // maximum number of connections to allow before slowing down
        "delay": number, // delay time in milliseconds (NOTE: will be multiplied by number of requests exceeds "delayAfter")
        "maxDelay": number, // max delay time in milliseconds,
        "skipFail": boolean, // skip failed request from record
        "skipSuccess": boolean, // skip success request from record
    },
    //* config for content secure policy in helmet middleware *//
    //* see https://helmetjs.github.io/#content-security-policy for more details */
    "csp": {
        "defaultSrc": string[], // array of domain names to be allowed for CSP default src
        "scriptSrc": string[], // array of domain names to be allowed for html script src
        "styleSrc": string[], // array of domain names to be allowed for html style src
        "fontSrc": string[], // array of domain names to be allowed for html font src
    }
}
```
