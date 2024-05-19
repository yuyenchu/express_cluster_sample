import jwt from 'jsonwebtoken';
import config from 'config';
import { nanoid } from 'nanoid';

import redisClient from '../models/redis.js';

const JWT = config.get('jwt');

function generateAccessToken(payload) {
    return jwt.sign(
        payload, 
        JWT.secret, 
        { expiresIn: JWT.accessExpire }
    );
}

async function generateRefreshToken(uid) {
    const refreshToken = nanoid(JWT.refreshLength);
    if (JWT.extendRefresh){
        await redisClient.set(`jwt:${uid}`, 
            JSON.stringify({
                refreshToken,
                expires: new Date()+JWT.refreshExpire
            })
        );
    } else {
        await redisClient.set(`jwt:${uid}`, 
            JSON.stringify({refreshToken}),
            'EX', 
            JWT.refreshExpire
        );
    }
    return refreshToken;
}

async function generateJWT(uid) {
    const accessToken = generateAccessToken({ uid });
    const refreshToken = await generateRefreshToken(uid);

    return { accessToken, refreshToken };
}
export { generateJWT, generateAccessToken, generateRefreshToken };