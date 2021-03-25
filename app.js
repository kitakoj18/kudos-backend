const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const jwt = require('jsonwebtoken');

const dotenv = require('dotenv').config();
const refreshTokenSignature = process.env.R_JWT_SIGNATURE;
const { createAccessToken, createRefreshToken, sendRefreshToken } = require('./util/tokens');

const sqlize = require('./util/database');
const Teacher = require('./models/teacher');
const Class = require('./models/class');
const Student = require('./models/student');
const Prize = require('./models/prize');
const Transaction = require('./models/transaction');
const Wish = require('./models/wish');

const auth = require('./middleware/auth');

const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => ({ req, res })
})

const app = express();

const whitelist = ['http://localhost:8000', 'http://104.32.92.60:8000']
// const whitelistIp = ['104.32.92.60']
// const corsOptionsDelegate = function(req, cb){
//     const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

//     let corsOptions;
//     if(whitelist.indexOf(req.header('Origin')) !== -1 || whitelistIp.indexOf(ip) !== -1){
//         corsOptions = { origin: true, credentials: true }
//     } else{
//         corsOptions = { origin: false, credentials: false }
//     }

//     cb(null, corsOptions)
// }

const corsOptionsDelegate = function(req, cb){
    let corsOptions;
    console.log(req.header('Origin'))
    if(whitelist.indexOf(req.header('Origin')) !== -1){
        console.log("made it into whitelist")
        corsOptions = { origin: true, credentials: true }
    } else{
        corsOptions = { origin: false, credentials: false}
    }
    cb(null, corsOptions)
}

app.use(cors(corsOptionsDelegate))

// app.use(
//     cors({
//         origin: "http://localhost:8000",
//         credentials: true
//     })
// )

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'images');
    },
    filename: (req, file, cb) =>{
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) =>{
    if(
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ){
        cb(null, true);
    } else{
        cb(null, false);
    }
}

app.use(bodyParser.json());
app.use(cookieParser());

app.use(
    multer({storage: fileStorage, fileFilter: fileFilter}).single('image')
);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(auth);

app.post('/refresh_token', (req, res, next) =>{

    // rTken is name of cookie assigned in login resolver
    const rfrshToken = req.cookies.rTken;
    if(!rfrshToken){
        return res.send({ error: true, accessToken: '' })
    }

    let decodedToken;
    try{
        decodedToken = jwt.verify(rfrshToken, refreshTokenSignature)
    } catch(err){
        return res.send({ error: true, accessToken: '' })
    }

    const userId = decodedToken.userId;
    const userType = decodedToken.userType;

    // add logic later to verify if user with userId exists in database
    // if not, send response where error is true and empty accessToken

    const newAcsToken = createAccessToken(userId, userType);
    const newRfrshToken = createRefreshToken(userId, userType);
    sendRefreshToken(res, newRfrshToken)

    return res.send({ error: false, accessToken: newAcsToken })

})

app.put('/post-iamge', (req, res, next) =>{
    if(!req.isAuth){
        throw new Error('Not Authenticated!')
    }
    if(!req.file){
        return res.status(200).json({ message: 'No file was provided!' })
    }
    if(req.body.oldPath){
        clearImage(req.body.oldPath)
    }
    return res.status(201).json({ message: 'File stored successfully', filePath: req.file.path })
})

app.use(helmet());
app.use(compression());

server.applyMiddleware({ app, cors: false });

// per documentation, good to include both directions of the association
// so that both models can have magic methods
Teacher.hasMany(Class);
Class.belongsTo(Teacher);

Class.hasMany(Student);
Student.belongsTo(Class);

Class.hasMany(Prize, {onDelete: 'CASCADE'});
Prize.belongsTo(Class);

Student.hasMany(Transaction);
Transaction.belongsTo(Student);
Transaction.belongsTo(Prize);

Student.hasMany(Wish);
Wish.belongsTo(Student);
Wish.belongsTo(Prize);

sqlize
    .sync()
    .then(result =>{
        // console.log(result);
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => console.log(err));

const clearImage = filePath =>{
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.log(err))
}