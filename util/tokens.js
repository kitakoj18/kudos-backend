const jwt = require('jsonwebtoken');

const dotenv = require('dotenv').config();
const accessTokenSignature = process.env.A_JWT_SIGNATURE;
const refreshTokenSignature = process.env.R_JWT_SIGNATURE;

exports.createAccessToken = ( userId, userType ) =>{
    return jwt.sign({
        userId: userId,
        userType: userType
    }, accessTokenSignature, { expiresIn: '15m' })
}

exports.createRefreshToken = ( userId, userType ) =>{
    return jwt.sign({
        userId: userId,
        userType: userType
    }, refreshTokenSignature, { expiresIn: '7d' })
}

exports.sendRefreshToken = ( res, refreshToken ) =>{
    res.cookie(
        "rTken",
        refreshToken,
        {
            httpOnly: true
        }
    )
}