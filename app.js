const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const sequelize = require('./util/database');
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

// const teacherRoutes = require('./routes/teacherRoutes');
// const studentRoutes = require('./routes/studentRoutes');

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
    multer({storage: fileStorage, fileFilter: fileFilter}).single('iamge')
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

app.use((req, res, next) =>{
    Teacher.findByPk(1)
        .then(teacher =>{
            req.teacher = teacher;
            return teacher;
        })
        .then(teacher =>{
            return Student.findByPk(1);
        })
        .then(student =>{
            req.student = student;
            next()
        })
        .catch(err => console.log(err));
})

app.use('/graphql',
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver
    })
);

// app.use('/teacher', teacherRoutes);
// app.use('/student', studentRoutes);

// per documentation, good to include both directions of the association
// so that both models can have magic methods
Teacher.hasMany(Class);
Class.belongsTo(Teacher);

Class.hasMany(Student);
Student.belongsTo(Class);

Class.hasMany(Prize, {onDelete: 'CASCADE'});
Prize.belongsTo(Class);

// Teacher.hasMany(Prize, {onDelete: 'CASCADE'});
// Prize.belongsTo(Teacher);

Student.hasMany(Transaction);
Transaction.belongsTo(Student);
Transaction.belongsTo(Prize);
//Prize.hasOne(Transaction);
//Transaction.hasOne(Prize)

Student.hasMany(Wish);
Wish.belongsTo(Student);
Wish.belongsTo(Prize);

let createdClass;

sequelize
    .sync({force:true})
    .then(result =>{
        return Teacher.findByPk(1);
    })
    .then(teacher =>{
        if(!teacher){
            return Teacher.create({firstName: 'Oscar', lastName: 'Cano', email: 'cano@la.edu', password: 'password', username: 'oscar'});
        }
        return teacher;
    })
    .then(teacher =>{
        return teacher.createClass({className: 'classRoom', imageUrl: 'imageUrl'});
    })
    .then(c =>{
        createdClass = c;
        return createdClass;
    })
    .then(c =>{
        return createdClass.createStudent({firstName: 'Neil', lastName: 'Yonzon', email: 'neil@gmail.com'})
    })
    .then(student =>{
        return createdClass.createPrize({name: 'Prize1', imageUrl: 'imageUrl'})
    })
    .then(result =>{
        // console.log(result);
        app.listen(3000);
    })
    .catch(err => console.log(err));