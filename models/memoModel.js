import Joi from 'joi';

import Pool from './pool.js';

async function addMemo(data) {
    const statement = {
        query: "INSERT INTO memos (`member`, `task`, `priority`) VALUES (?,?,?);",
        fields: ['username', 'task', 'priority']
    };

    data = await Joi.object({
        username: Joi.string().max(80).required(),
        task: Joi.string().max(100).required(),
        priority: Joi.string().valid('high','middle','low').required()
    }).validateAsync(data);
    const res = await Pool.query(statement, data);
    return res[0];
}

async function markMemo(data) {
    const statement = {
        query: "UPDATE memos SET `done`=True WHERE `id`=?;",
        fields: ['id']
    };

    data = await Joi.object({
        id: Joi.number().min(0).required()
    }).validateAsync(data);
    const res = await Pool.query(statement, data);
    return res[0];
}

async function deleteMemo(data) {
    const statement = {
        query: "DELETE FROM memos WHERE `id`=?;",
        fields: ['id']
    };
    
    data = await Joi.object({
        id: Joi.number().min(0).required()
    }).validateAsync(data);
    const res = await Pool.query(statement, data);
    return res[0];
}


const memoModel = { addMemo, markMemo, deleteMemo }
export default memoModel;