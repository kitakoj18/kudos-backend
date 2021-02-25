const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');

const sqlize = require('./util/database');
const Teacher = require('./models/teacher');
const Class = require('./models/class');
const Student = require('./models/student');
const Prize = require('./models/prize');
const Transaction = require('./models/transaction');
const Wish = require('./models/wish');

const auth = require('./middleware/auth');

const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

const app = express();

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

app.use(
    multer({storage: fileStorage, fileFilter: fileFilter}).single('image')
);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(req.method === 'OPTIONS'){
      return res.sendStatus(200);
    }
    next();
  });

app.use(auth);

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

app.use('/graphql',
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver
    })
);

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