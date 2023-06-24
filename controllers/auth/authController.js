import config from 'config';

import authModel from '../../models/authModel.js';
import redisClient from '../../models/redis.js';
import { generateJWT } from './utils.js';

const USE_SSL = config.get('useSSL');

async function register(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.sendStatus(400);
    }
    if (req?.session?.username) {
        return res.sendStatus(403);
    }

    if (await authModel.hasUser({username})) {
        res.render('login', {message: 'Username already exist', messageColor: 'red'});
    } else {
        try{
            await authModel.registerUser({username, password});
        } catch(err){
            console.error(err);
        }
        return login(req, res);
    }
}

async function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.sendStatus(400);
    }
    if (req?.session?.username) {
        return res.sendStatus(403);
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

async function logout(req, res) {
    if (!req?.session?.username) {
        return res.sendStatus(403);
    }

    const { username } = req.session;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await redisClient.del(`${ip}/${username}`);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    req.session.username = undefined;
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/home');
    });
}

const AuthController = { register, login, logout };
export default AuthController;