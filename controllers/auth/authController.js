import authModel from '../../models/authModel.js';

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
        res.redirect('/memo');
    } else {
        res.render('login', {message: 'Username or password is incorrect', messageColor: 'red'});
    }
}

function logout(req, res) {
    if (!req?.session?.username) {
        return res.sendStatus(403);
    }
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