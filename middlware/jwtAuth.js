const jwt = require("jsonwebtoken");
const config = require('config');
const SECRET = config.get('secret');
const NON_SECURE_PATHS = config.get('nonSecurePaths');

const verifyToken = (req, res, next) => {
    // if (NON_SECURE_PATHS.includes(req.path)) {
    //     return next();
    // }

    const token =
        req.headers.authorization || 
        req.headers["x-access-token"]||
        req.query.token || 
        req.body.token;
    // console.log(token)
    if (!token) {
        return res.status(403).send({message:"A token is required for authentication"});
    }
    try {
        const decoded = jwt.verify(token.replace('Bearer ',''), SECRET);
        // console.log("decoded")
        req.user = decoded;
        req.username = decoded.user;
    } catch (err) {
        return res.status(401).send({message:"Invalid Token"});
    }
    return next();
};

module.exports = verifyToken;