import config from 'config';
import RedisClient from "ioredis";

const REDIS = config.get('redis');

// create redis client connection
const redisClient = new RedisClient({
    host: REDIS.host,
    port: REDIS.port,
    ...(REDIS.password && {password: REDIS.password}),
});
redisClient.on('error', function (err) {
    console.log(`[ERROR] Could not establish a connection with redis: ${err}`);
});
redisClient.on('connect', function (err) {
    console.log('[INFO] Connected to redis successfully');
});

export default redisClient;