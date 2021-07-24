const jwt = require('jsonwebtoken');

const dotenv = require('dotenv').config();
const accessTokenSignature = process.env.A_JWT_SIGNATURE;

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader){
        req.isAuth = false;
        return next();
    }

    let decodedToken;
    try {
        const acsToken = authHeader.split(' ')[1];
        // throws error if expired or invalid
        decodedToken = jwt.verify(acsToken, accessTokenSignature);

    } catch(err) {
        console.log(err)
        req.isAuth = false;
        return next();
    }

    req.userId = decodedToken.userId;
    req.isAuth = true;
    req.userType = decodedToken.userType;
    req.classId = decodedToken.classId;
    next();
}