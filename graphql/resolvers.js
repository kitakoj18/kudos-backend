const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Teacher = require('../models/teacher');
const Class = require('../models/class');
const Student = require('../models/student');
const Prize = require('../models/prize');
const Transaction = require('../models/transaction');

const dotenv = require('dotenv').config();
const token_signature = process.env.JWT_SIGNATURE;

const Op = require('Sequelize').Op;

module.exports = {
    createTeacher: async function({ teacherInput }, req){

        const firstName = teacherInput.firstName;
        const lastName = teacherInput.lastName;
        const username = teacherInput.username;
        const email = teacherInput.email;
        const password = teacherInput.password;

        const condition = {
            [Op.or]: [
                {email: email},
                {username: username}
            ]
        }

        const existingTeacher = await Teacher.findOne({where: condition});
        if(existingTeacher) {
            let error;
            if(existingTeacher.email === email) {
                error = new Error('This email already exists');
            } else {
                error = new Error('This username already exists');
            }
            throw error;
        }

        const hashedPw = await bcrypt.hash(password, 12);
        const teacher = await Teacher.create({
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            password: hashedPw
        });

        return teacher;
    },
    loginTeacher: async function({ teacherInput }, req){

        const username = teacherInput.username;
        const password = teacherInput.password;
        const teacher = await Teacher.findOne({where: {username: username}});
        if(!teacher) {
            const error = new Error('Teacher with this username does not exist');
            error.code = 401;
            throw error;
        }

        const validPassword = await bcrypt.compare(password, teacher.password);
        if(!validPassword) {
            const error = new Error('Incorrect password. Please try again.');
            error.code = 401;
            throw error;
        }

        const token = jwt.sign({
            userId: teacher.id.toString(),
        }, token_signature, {expiresIn: '1h'});

        return {token: token, userId: teacher.userId};
    },
    teacher: async function(args, req){

        if(!req.isAuth){
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const teacherId = req.userId;
        const teacher = await Teacher.findOne({
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
                            },
                            include: [
                                {model: Transaction,
                                    attributes: {
                                        exclude: ['createdAt', 'updatedAt']
                                    }
                                }
                            ]
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
        });

        return teacher.toJSON();
    },
    createClass: async function({ classInput }, req){

        if(!req.isAuth){
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const teacher = await Teacher.findByPk(req.userId);
        teacher.createClass({className: classInput.className, imageUrl: classInput.imageUrl});
    },
    createStudent: async function({ studentInput }, req) {

        if(!req.isAuth){
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const cls = await Class.findByPk(studentInput.classId);
        if(!cls){
            const error = new Error(`Something went wrong! The class with id ${studentInput.classId} cannot be found!`);
            error.code = 400;
            throw error;
        }

        const hashedPw = await bcrypt.hash(studentInput.password, 12);
        cls.createStudent({
            firstName: studentInput.firstName,
            lastName: studentInput.lastName,
            username: studentInput.username,
            password: hashedPw
        });
    },
    createPrize: async function({ prizeInput }, req){

        if(!req.isAuth){
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const cls = await Class.findByPk(prizeInput.classId);
        if(!cls){
            const error = new Error(`Something went wrong! The class with id ${prizeInput.classId} cannot be found!`);
            error.code = 400;
            throw error;
        }

        cls.createPrize({
            name: prizeInput.name,
            imageUrl: prizeInput.imageUrl
        })
    },
    adjustStudentBalance: async function({ adjustedBalanceData }, req){

        const student = await Student.findByPk(adjustedBalanceData.studentId);
        if(!student){
            const error = new Error(`Something went wrong! The student with id ${adjustedBalanceData.studentId} cannot be found!`);
            error.code = 400;
            throw error;
        }

        student.balance = adjustedBalanceData.newBalance;
        await student.save();
        return student;

    },
    toggleTreasureBox: async function({ classId }, req){

        const cls = await Class.findByPk(classId);
        if(!cls){
            const error = new Error(`Something went wrong! The class with id ${classId} cannot be found!`);
            error.code = 400;
            throw error;
        }

        cls.treasureBoxOpen = !cls.treasureBoxOpen;
        cls.save();

    },
    postTransaction: async function({ transactionInput }, req){

        const student = await Student.findByPk(transactionInput.studentId);

        // get student class and check if treasurebox is open before moving forward with transaction
        const studentClass = await Class.findByPk(student.classId);
        if(studentClass.treasureBoxOpen){
            // create transaction tied to the student
            student.createTransaction({prizeId: transactionInput.prizeId});
            // deduct prize cost from student balance
            student.kudosBalance -= transactionInput.kudosCost;
            await student.save();

            // get this transaction, which is the last transaction made by student to return for mutation
            const transactions = await student.getTransactions();
            const lastTransactionId = transactions[transactions.length - 1].toJSON().id;
            const lastTransaction = await Transaction.findOne({
                where: {
                    id: lastTransactionId
                },
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                },
                include: [
                    {model: Prize,
                        attributes: {
                            exclude: ['id', 'createdAt', 'updatedAt']
                        }
                    }
                ]
            });

            //console.log(lastTransaction.toJSON());
            return lastTransaction.toJSON();
        }
        else{
            // raise an error
        }
    },
    approveTransaction: async function({ approveInput }, req){

        const transaction = await Transaction.findByPk(approveInput.transactionId);

        // if transaction is approved by teacher, change status to approved
        if (approveInput.transactionApproved === true){
            transaction.approved = 1;
            await transaction.save();
            return transaction;
        }

        // else, add cost of prize back to student's balance
        // do we want to delete this transaction completely from the database?
        const studentId = transaction.studentId;
        const prizeId = transaction.prizeId;

        const student = await Student.findByPk(studentId);
        const prize = await Prize.findByPk(prizeId);
        student.kudosBalance += prize.kudosCost;
        await student.save();

        return transaction;

    }
};