const jwt = require('jsonwebtoken');

const dotenv = require('dotenv').config();
const token_signature = process.env.JWT_SIGNATURE;

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader){
        req.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, token_signature);
    } catch(err) {
        req.isAuth = false;
        return next();
    }

    if(!decodedToken) {
        req.isAuth = false;
        return next();
    }

    //might need to do two separate auth middlewares for teachers and students
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
}