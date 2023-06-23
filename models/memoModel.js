import Pool from './pool.js';

async function addMemo(data) {
    const statement = {
        query: "INSERT INTO memos (`member`, `task`, `priority`) VALUES (?,?,?);",
        fields: ['username', 'task', 'priority']
    };
    const res = await Pool.query(statement, data);
    return res[0];
}

async function markMemo(data) {
    const statement = {
        query: "UPDATE memos SET `done`=True WHERE `id`=?;",
        fields: ['id']
    };
    const res = await Pool.query(statement, data);
    return res[0];
}

async function deleteMemo(data) {
    const statement = {
        query: "DELETE FROM memos WHERE `id`=?;",
        fields: ['id']
    };
    const res = await Pool.query(statement, data);
    return res[0];
}


const memoModel = { addMemo, markMemo, deleteMemo }
export default memoModel;