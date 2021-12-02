const jwt = require('jsonwebtoken');

const dotenv = require('dotenv').config();
const isProd = process.env.PORT;
const accessTokenSignature = process.env.A_JWT_SIGNATURE;
const refreshTokenSignature = process.env.R_JWT_SIGNATURE;

exports.createAccessToken = ( userId, userType, classId ) =>{
    return jwt.sign({
        userId,
        userType,
        classId
    }, accessTokenSignature, { expiresIn: isProd ? '15m' : '1h'})
}

exports.createRefreshToken = ( userId, userType, classId ) =>{
    return jwt.sign({
        userId,
        userType,
        classId
    }, refreshTokenSignature, { expiresIn: '7d' })
}

exports.sendRefreshToken = ( res, refreshToken ) =>{
    res.cookie(
        "rTken",
        refreshToken,
        {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            path: '/refresh_token'
        }
    )
}