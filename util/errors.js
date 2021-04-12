const { AuthenticationError } = require('apollo-server')

exports.checkAuth = (req, userTypeSign, userType) =>{
    if(!req.isAuth){
        throw new AuthenticationError('Not authenticated!')
    }

    if(req.userType !== userTypeSign){
        throw new AuthenticationError(`Sorry, you must be a ${userType} to access this page or do this action!`)
    }
}

exports.checkObj = (obj, type, id) =>{
    if(!obj){
        const error = new Error(`Something went wrong No ${type} with id ${id} can be found`);
        error.code = 401;
        throw error;
    }
    
}