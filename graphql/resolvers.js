const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Teacher = require('../models/teacher');
const Class = require('../models/class');
const Student = require('../models/student');
const Prize = require('../models/prize');
const Transaction = require('../models/transaction');
const Wish = require('../models/wish');

const dotenv = require('dotenv').config();
const teacherSignInType = process.env.TEACHER_TYPE;
const studentSignInType = process.env.STUDENT_TYPE;
const { createAccessToken, createRefreshToken, sendRefreshToken } = require('../util/tokens');

const Op = require('sequelize').Op;

module.exports = {
    Query: {
        teacher: async function(_, __, { req }){

            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to access this page!');
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
    
            if(!teacher){
                const error = new Error(`Something went wrong No teacher with id ${teacherId} can be found`);
                error.code = 401;
                throw error;
            }
    
            return teacher.toJSON();
        },
        student: async function(_, __, { req }){
    
            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            if(req.userType !== studentSignInType){
                const error = new Error('Sorry, you must be a student to access this page!');
                error.code = 401;
                throw error;
            }
    
            const studentId = req.userId;
            const student = await Student.findOne({
                where: {
                   id: studentId 
                },
                attributes: {
                    include: [['id', 'studentId']],
                    exclude: ['id', 'createdAt', 'updatedAt']
                },
                include: [
                    {
                        model: Transaction,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt']
                            }
                    },
                    {
                        model: Wish,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt']
                            }
                    }
                ]
            });
    
            if(!student){
                const error = new Error(`Something went wrong No student with id ${studentId} can be found`);
                error.code = 401;
                throw error;
            }
    
            return student.toJSON();
        }
    },
    Mutation: {
        createTeacher: async function(_, { teacherInput }){

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
        loginTeacher: async function(_, { teacherInput }, { res }){
    
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

            const acsToken = createAccessToken(teacher.id.toString(), teacherSignInType);
            const rfrshToken = createRefreshToken(teacher.id.toString(), teacherSignInType);

            sendRefreshToken(res, rfrshToken);
    
            return {accessToken: acsToken, userId: teacher.id};
        },
        createClass: async function(_, { classInput }, { req }){
    
            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to create a new class!');
                error.code = 401;
                throw error;
            }
    
            const teacher = await Teacher.findByPk(req.userId);
            teacher.createClass({className: classInput.className, imageUrl: classInput.imageUrl});
        },
        createStudent: async function(_, { studentInput }, { req }) {
    
            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to create a new student!');
                error.code = 401;
                throw error;
            }
    
            const cls = await Class.findByPk(studentInput.classId);
            if(!cls){
                const error = new Error(`Something went wrong! The class with id ${studentInput.classId} cannot be found!`);
                error.code = 400;
                throw error;
            }
    
            const student = await Student.findOne({where: {
                username: studentInput.username 
             }});
            if(student){
                const error = new Error('A student with this username already exists!');
                error.code = 401;
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
        deleteStudents: async function(_, { studentInput }, { req }){
    
            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to create a new prize!');
                error.code = 401;
                throw error;
            }
    
            Student.destroy({ where: { id: studentInput.studentIds } })
        },
        createPrize: async function(_, { prizeInput }, { req }){
    
            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to create a new prize!');
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
                imageUrl: prizeInput.imageUrl,
                kudosCost: prizeInput.kudosCost,
                description: prizeInput.description || '',
                category: prizeInput.category || '',
                quantity: prizeInput.quantity
            })
        },
        editPrize: async function(_, { prizeInput }, { req }){
    
            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to create a new prize!');
                error.code = 401;
                throw error;
            }
    
            const prize = await Prize.findByPk(prizeInput.prizeId);
            if(!prize){
                const error = new Error(`Something went wrong! The prize with id ${prizeInput.prizeId} cannot be found!`);;
                error.code = 404;
                throw error;
            }
    
            prize.name = prizeInput.name;
            prize.imageUrl = prizeInput.imageUrl;
            prize.kudosCost = prizeInput.kudosCost;
            prize.description = prizeInput.description || '';
            prize.category = prizeInput.category || '';
            prize.quantity = prizeInput.quantity;
            await prize.save();
        },
        adjustStudentBalance: async function(_, { adjustedBalanceData }, { req }){
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to perform this action!');
                error.code = 401;
                throw error;
            }
    
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
        toggleTreasureBox: async function(_, { classId }, { req }){
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to perform this action!');
                error.code = 401;
                throw error;
            }
    
            const cls = await Class.findByPk(classId);
            if(!cls){
                const error = new Error(`Something went wrong! The class with id ${classId} cannot be found!`);
                error.code = 400;
                throw error;
            }
    
            cls.treasureBoxOpen = !cls.treasureBoxOpen;
            cls.save();
    
        },
        approveTransaction: async function(_, { approveInput }, { req }){
    
            if(req.userType !== teacherSignInType){
                const error = new Error('Sorry, you must be a teacher to perform this action!');
                error.code = 401;
                throw error;
            }
    
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
    
            prize.quantity += 1;
            await prize.save();
    
            return transaction;
        },
        loginStudent: async function(_, { studentInput }){
    
            const username = studentInput.username;
            const password = studentInput.password;
            const student = Student.findOne({where: {username: username}});
    
            if(!student){
                const error = new Error('Student with this username does not exist!');
                error.code = 400;
                throw error;
            }
    
            const validPassword = await bcrypt.compare(password, student.password);
            if(!validPassword) {
                const error = new Error('Incorrect password. Please try again.');
                error.code = 401;
                throw error;
            }
    
            const token = jwt.sign({
                userId: student.id.toString(),
                userType: studentSignInType
            }, tokenSignature, {expiresIn: '1h'});
    
            return {token: token, userId: student.id};
        },
        postTransaction: async function(_, { transactionInput }, { req }){
    
            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            // if(req.userType !== studentSignInType){
            //     const error = new Error('Sorry, you must be a student to access this page!');
            //     error.code = 401;
            //     throw error;
            // }
    
            const student = await Student.findByPk(req.userId);
            if(!student){
                const error = new Error(`Something went wrong! No student with id ${studentId} can be found`);
                error.code = 404;
                throw error;
            }
    
            // get student class and check if treasurebox is open before moving forward with transaction
            const studentClass = await Class.findByPk(student.classId);
            if(!studentClass){
                const error = new Error(`Something went wrong! No class with id ${student.classId} can be found`);
                error.code = 404;
                throw error;
            }
    
            if(!studentClass.treasureBoxOpen){
                const error = new Error('The treasure box for your class is currently not open!');
                error.code = 404;
                throw error;
            }
    
            const prize = await Prize.findByPk(transactionInput.prizeId);
            if(!prize){
                const error = new Error(`Something went wrong! No prize with id ${transactionInput.prizeId} can be found`)
            }
            if(prize.quantity < 1){
                const error = new Error(`I'm sorry! The prize ${prize.name} is not available right now. Please try again later!`);
                error.code = 404;
                throw error;
            }
            
            // create transaction tied to the student
            student.createTransaction({ 
                prizeId: transactionInput.prizeId, 
                prizeName: prize.name, 
                prizeImageUrl: prize.imageUrl, 
                prizeCost: prize.kudosCost });
            // deduct prize cost from student balance
            student.kudosBalance -= prize.kudosCost;
            await student.save();
    
            prize.quantity -= 1
            await prize.save();
    
            // get this transaction, which is the last transaction made by student to return for mutation
            // const transactions = await student.getTransactions();
            // const lastTransactionId = transactions[transactions.length - 1].toJSON().id;
            // const lastTransaction = await Transaction.findOne({
            //     where: {
            //         id: lastTransactionId
            //     },
            //     attributes: {
            //         exclude: ['createdAt', 'updatedAt']
            //     },
            //     include: [
            //         {model: Prize,
            //             attributes: {
            //                 exclude: ['id', 'createdAt', 'updatedAt']
            //             }
            //         }
            //     ]
            // });
    
            //console.log(lastTransaction.toJSON());
            //return lastTransaction.toJSON();
        },
        addToWishlist: async function(_, { wishlistInput }, { req }){
            
            if(!req.isAuth){
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            }
    
            if(req.userType !== studentSignInType){
                const error = new Error('Sorry, you must be a student to access this page!');
                error.code = 401;
                throw error;
            }
    
            const student = await Student.findByPk(req.userId);
            if(!student){
                const error = new Error(`Something went wrong No student with id ${studentId} can be found`);
                error.code = 404;
                throw error;
            }
            student.createWish({ prizeId: wishlistInput.prizeId })
        }
    }
};