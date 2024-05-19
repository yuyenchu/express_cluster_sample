import config from 'config';

import authModel from '../../models/authModel.js';
import redisClient from '../../models/redis.js';
import { generateJWT } from '../../utils/jwtGen.js';
import { AuthError } from '../../utils/errors.js';

const USE_SSL = config.get('useSSL');

async function register(req, res, next) {
    const { username, password } = req.body;
    if (!username || !password) {
        return next(new AuthError('username or password missing', 400, username, password));
    }
    if (req?.session?.username) {
        return next(new AuthError('user already logged in', 403, username, password));
    }
    if (username.length > 80 ) {
        return res.render('login', {message: 'Username too long', messageColor: '#e4a11b'});
    }
    if (password.length > 41) {
        return res.render('login', {message: 'Password too long', messageColor: '#e4a11b'});
    }

    if (await authModel.hasUser({username})) {
        res.render('login', {message: 'Username already exist', messageColor: 'red'});
    } else {
        await authModel.registerUser({username, password});
        return login(req, res);
    }
}

async function login(req, res, next) {
    const { username, password } = req.body;
    if (!username || !password) {
        return next(new AuthError('username or password missing', 400, username, password));
    }
    if (req?.session?.username) {
        return next(new AuthError('user already logged in', 403, username, password));
    }

    if (await authModel.checkUser({username, password})) {
        req.session.username = username;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const { accessToken, refreshToken } = await generateJWT(`${ip}/${username}`);
        res.cookie("accessToken", accessToken, {
            secure: USE_SSL,
            httpOnly: true
        });
        res.cookie("refreshToken", refreshToken, {
            secure: USE_SSL,
            httpOnly: true
        });
        res.redirect('/memo');
    } else {
        res.render('login', {message: 'Username or password is incorrect', messageColor: 'red'});
    }
}

async function logout(req, res, next) {
    if (!req?.session?.username) {
        return next(new AuthError('user not logged in', 403));
    }

    const { username } = req.session;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await redisClient.del(`${ip}/${username}`);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    req.session.username = undefined;
    req.session.destroy((err) => {
        if (err) {
            return next(new AuthError('cannot destroy session', 500, username));
        }
        res.redirect('/home');
    });
}

const AuthController = { register, login, logout };
export default AuthController;