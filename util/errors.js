exports.checkAuth = (req, userTypeSign, userType) =>{
    if(!req.isAuth){
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
    }

    if(req.userType !== userTypeSign){
        const error = new Error(`Sorry, you must be a ${userType} to access this page or do this action!`);
        error.code = 401;
        throw error;
    }
}