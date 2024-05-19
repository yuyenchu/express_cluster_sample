import memoModel from '../../models/memoModel.js';

function hi(req, res) {
    res.send("Hello!!!");
}

async function addMemo(req, res) {
    const { task, priority } = req.body;
    const { username} = req?.session;
    if (!task || !priority) {
        return res.sendStatus(400);
    }
    if (!username) {
        return res.sendStatus(403);
    }

    await memoModel.addMemo({username, task, priority});
    res.redirect('/memo');
}

async function markMemo(req, res) {
    const { id } = req.body;
    const { username} = req?.session;
    if (!id) {
        return res.sendStatus(400);
    }
    if (!username) {
        return res.sendStatus(403);
    }

    await memoModel.markMemo({id});
    res.redirect('/memo');
}

async function deleteMemo(req, res) {
    const { id } = req.body;
    const { username} = req?.session;
    if (!id) {
        return res.sendStatus(400);
    }
    if (!username) {
        return res.sendStatus(403);
    }

    await memoModel.deleteMemo({id});
    res.redirect('/memo');
}

const APIController = { hi, addMemo, markMemo, deleteMemo };

export default APIController;