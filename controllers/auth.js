const Teacher = require('../models/teacher');
const Class = require('../models/class');
const Student = require('../models/student');
const Prize = require('../models/prize');

exports.getDashboard = (req, res, next) => {
    // get all classes teacher teaches
    const teacherId = req.teacher.id;
    Teacher.findOne({
        where: {
           id: teacherId 
        },
        attributes: {
            include: [['id', 'teacherId']],
            exclude: ['id', 'createdAt', 'updatedAt']
        },
        // nested eager loading
        include: [
            {model: Class,
                attributes: {
                    include: [['id', 'classId']],
                    exclude: ['id', 'createdAt', 'updatedAt']
                },
                include: [
                    {model: Student,
                        attributes: {
                            include: [['id', 'studentId']],
                            exclude: ['id', 'createdAt', 'updatedAt']
                        }
                    },
                    {model: Prize,
                        attributes: {
                            include: [['id', 'prizeId']],
                            exclude: ['id', 'createdAt', 'updatedAt']
                        }
                    }
                ]
            }
        ]
    })
    .then(result => {
        // console.log(results);
        res.status(200).json({message: 'retrieved dashboard info', dashboardInfo: result})
    })
    .catch(err => console.log(err));
};

exports.addPrize = (req, res, next) => {
    
    const name = req.body.name;
    const description = req.body.description;
    const kudosCost = req.body.kudosCost;
    const imageUrl = req.file.path;

    //magic method provided by Sequelize
    req.teacher.createPrize({
        name: name,
        imageUrl: imageUrl,
        description: description,
        kudosCost: kudosCost
    })
    .then(result =>{
        res.status(201).json({
            message: 'A new prize added successfully'
        })
    })
    .catch(err => console.log(err));
};

exports.getEditPrize = (req, res, next) =>{

};

exports.postEditPrize = (req, res, next) =>{

    const prizeId = req.body.prizeId;
    const updatedName = req.body.name;
    const updatedDescription = req.body.description;
    const updatedKudosCost = req.body.kudosCost;
    const updatedImageUrl = req.file.path;

    Prize.findByPk(prizeId)
        .then(prize =>{
            prize.name = updatedName;
            prize.imageUrl = updatedImageUrl;
            prize.description = updatedDescription;
            prize.kudosCost = updatedKudosCost;

            return prize.save();
        })
        .then(result =>{
            res.status(201).json({
                message: 'Prize successfully edited'
            })
        })
        .catch(err => console.log(err));
};

exports.deletePrize = (req, res, next) =>{
    
    const prizeId = req.body.prizeId;
    Prize.findByPk(prizeId)
        .then(prize =>{
            return prize.destroy();
        })
        .then(result =>{ 
            //is this right status code?
            res.status(201).json({
                message: 'Prize successsfully deleted'
            })
        })
        .catch(err => console.log(err));
};