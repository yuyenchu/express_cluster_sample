import Joi from 'joi';

import Pool from './pool.js';

async function hasUser(data) {
    const statement = {
        query: "SELECT COUNT(*) AS count FROM users WHERE username=?;",
        fields: ['username']
    };

    data = await Joi.object({
        username: Joi.string().max(80).required()
    }).validateAsync(data);
    const res = await Pool.query(statement, data);
    return res[0][0].count > 0;
}

async function checkUser(data) {
    const statement = {
        query: "SELECT COUNT(*) AS count FROM users WHERE `username`=? AND `password`=?;",
        fields: ['username', 'password']
    };

    data = await Joi.object({
        username: Joi.string().max(80).required(),
        password: Joi.string().max(41).required()
    }).validateAsync(data);
    const res = await Pool.query(statement, data);
    return res[0][0].count === 1;
}

async function registerUser(data) {
    const statement = {
        query: "INSERT INTO users (`username`, `password`) VALUES (?, ?);",
        fields: ['username', 'password']
    };

    data = await Joi.object({
        username: Joi.string().max(80).required(),
        password: Joi.string().max(41).required()
    }).validateAsync(data);
    const res = await Pool.query(statement, data);
    return res[0];
}

const authModel = { hasUser, checkUser, registerUser }
export default authModel;