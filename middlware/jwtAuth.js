import jwt from 'jsonwebtoken';
import config from 'config';

import redisClient from '../models/redis.js';
import { generateAccessToken, generateRefreshToken } from '../controllers/auth/utils.js';

const JWT = config.get('jwt');
const USE_SSL = config.get('useSSL');

function verifyToken(req, res, next) {
    const token =
        req.headers.authorization ||
        req.headers["x-access-token"] ||
        req.query.token ||
        req.body.token;

    if (!token) {
        return res.status(403).send({ message: "A token is required for authentication" });
    }
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT.secret);
        req.user = decoded;
        req.username = decoded.user;
    } catch (err) {
        return res.status(401).send({ message: "Invalid Token" });
    }
    return next();
};

function validateJWT(req, res, next) {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken || !refreshToken) return res.status(403).end("JWT missing");

    jwt.verify(accessToken, JWT.secret, async function(err, decoded) {
        if (JWT.extendAccess && err && err.name === "TokenExpiredError"){
            const payload = jwt.verify(accessToken, JWT.secret, {ignoreExpiration: true});
            const uid = payload?.uid;
            if (!uid) return res.status(401).end("payload missing in token");

            const redis_token = JSON.parse(await redisClient.get(`jwt:${uid}`, function(err, val) {
                return err ? null : val;
            }));

            if (!redis_token?.refreshToken || redis_token.refreshToken !== refreshToken) 
                return res.status(401).end("refresh token expired or mismatch");
            
            if (JWT.extendRefresh && redis_token.expires > new Date()) {
                const refreshToken = generateRefreshToken(uid);
                res.cookie("refreshToken", refreshToken, {
                    secure: USE_SSL,
                    httpOnly: true
                });
            }

            const accessToken = generateAccessToken({uid});
            res.cookie("accessToken", accessToken, {
                secure: USE_SSL,
                httpOnly: true
            });

            req.jwt = payload;
            next();
        } else if (err) {
            // console.log('[INFO] jwt error: ', err)
            res.status(401).end("invalid token");
        } else {
            req.jwt = decoded;
            next();
        }
    });
}

function renewAccessToken(req, res, next) {
    if (!req?.session?.username) return next();

    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken || !refreshToken) return res.status(403).end("JWT missing");

    jwt.verify(accessToken, JWT.secret, async function(err, decoded) {
        if (err && err.name === "TokenExpiredError"){
            const payload = jwt.verify(accessToken, JWT.secret, {ignoreExpiration: true});
            const uid = payload?.uid;
            if (!uid) return res.status(401).end("payload missing in token");
           
            const redis_token = JSON.parse(await redisClient.get(`jwt:${uid}`, function(err, val) {
                return err ? null : val;
            }));
            if (!redis_token?.refreshToken || redis_token.refreshToken !== refreshToken) 
                return res.status(401).end("refresh token expired or mismatch");

            if (!JWT.extendRefresh || redis_token.expires <= new Date()) {
                const accessToken = generateAccessToken({uid});
                res.cookie("accessToken", accessToken, {
                    secure: USE_SSL,
                    httpOnly: true
                });

                req.jwt = payload;
                next();
            } else {
                res.status(401).end("refresh token expired");
            }
        } else if (err) {
            console.log('[INFO] jwt error: ', err)
            res.status(401).end("invalid token");
        } else {
            req.jwt = decoded;
            next();
        }
    })
}

export { validateJWT, renewAccessToken };
