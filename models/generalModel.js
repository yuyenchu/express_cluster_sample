import Joi from 'joi';

import Pool from './pool.js';

async function getUserCount() {
    const statement = {
        query: "SELECT COUNT(*) AS count FROM users;",
        fields: []
    };
    const res = await Pool.query(statement, []);
    return res[0][0].count;
}

async function getThreeMemo() {
    const statement = {
        query: "SELECT * FROM memos ORDER BY `id` DESC LIMIT 3;",
        fields: []
    };
    const res = await Pool.query(statement, []);
    return res[0];
}

async function getAllMemo() {
    const statement = {
        query: "SELECT * FROM memos ORDER BY `id` DESC;",
        fields: []
    };
    const res = await Pool.query(statement, []);
    return res[0];
}

async function getUserMemo(username) {
    const statement = {
        query: "SELECT * FROM memos WHERE `member`=? ORDER BY `id` DESC;",
        fields: ['username']
    };

    username = await Joi.string()
        .max(80)
        .required()
        .validateAsync(username);
    const res = await Pool.query(statement, {username});
    return res[0];
}

const generalModel = { getUserCount, getThreeMemo, getAllMemo, getUserMemo }
export default generalModel;