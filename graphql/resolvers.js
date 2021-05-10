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
const { checkAuth, checkObj } = require('../util/errors');

const Op = require('sequelize').Op;

let TEACHER_STR = 'teacher'
let CLASS_STR = 'class'
let STUDENT_STR = 'student'
let PRIZE_STR = 'prize'

module.exports = {
    Query: {
        teacher: async function(_, __, { req }){

            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const teacherId = req.userId;
            const teacher = await Teacher.findOne({
                where: {
                   id: teacherId 
                },
                // nested eager loading
                include: [
                    {model: Class}
                ]
            });

            checkObj(teacher, TEACHER_STR, teacherId)
    
            return teacher.toJSON();
        },
        getClassInfo: async function(_, { classId }, { req }){

            checkAuth(req, teacherSignInType, TEACHER_STR)

            const cls = await Class.findOne({
                where: {
                   id: classId
                },
                // nested eager loading
                include: [
                    {model: Student,
                        include: [
                            {model: Transaction}
                        ]
                    },
                    {model: Prize}
                ]
            });

            checkObj(cls, CLASS_STR, classId)

            return cls.toJSON()
        },
        student: async function(_, __, { req }){
    
            checkAuth(req, studentSignInType, STUDENT_STR)
    
            const studentId = req.userId;
            const student = await Student.findOne({
                where: {
                   id: studentId 
                },
                include: [
                    {
                        model: Transaction
                    },
                    {
                        model: Wish
                    }
                ]
            });

            checkObj(student, STUDENT_STR, studentId)
    
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
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const teacher = await Teacher.findByPk(req.userId);
            teacher.createClass({className: classInput.className, imageUrl: classInput.imageUrl});
        },
        createStudent: async function(_, { studentInput }, { req }) {
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const cls = await Class.findByPk(studentInput.classId);
            checkObj(cls, CLASS_STR, studentInput.classId)
    
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
        editStudent: async function(_, { studentInput }, { req }){

            checkAuth(req, teacherSignInType, TEACHER_STR)

            const student = await Student.findOne({where: {
                id: studentInput.id
            }})
            checkObj(student, STUDENT_STR, studentInput.id)

            student.firstName = studentInput.firstName
            student.lastName = studentInput.lastName
            student.username = studentInput.username
            student.password = studentInput.password
            await student.save();
            
        },
        deleteStudents: async function(_, { studentInput }, { req }){
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            Student.destroy({ where: { id: studentInput.studentIds } })
        },
        createPrize: async function(_, { prizeInput }, { req }){
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const cls = await Class.findByPk(prizeInput.classId);
            checkObj(cls, CLASS_STR, prizeInput.classId)
    
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
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const prize = await Prize.findByPk(prizeInput.prizeId);
            checkObj(prize, PRIZE_STR, prizeInput.prizeId)
    
            prize.name = prizeInput.name;
            prize.imageUrl = prizeInput.imageUrl;
            prize.kudosCost = prizeInput.kudosCost;
            prize.description = prizeInput.description || '';
            prize.category = prizeInput.category || '';
            prize.quantity = prizeInput.quantity;
            await prize.save();
        },
        adjustStudentBalance: async function(_, { adjustedBalanceData }, { req }){
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const student = await Student.findByPk(adjustedBalanceData.studentId);
            checkObj(student, STUDENT_STR, adjustedBalanceData.studentId)
    
            student.balance = adjustedBalanceData.newBalance;
            await student.save();
            return student;
    
        },
        toggleTreasureBox: async function(_, { classId }, { req }){
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const cls = await Class.findByPk(classId);
            checkObj(cls, CLASS_STR, classId)
    
            cls.treasureBoxOpen = !cls.treasureBoxOpen;
            cls.save();
    
        },
        approveTransaction: async function(_, { approveInput }, { req }){
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
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
    
            checkAuth(req, studentSignInType, STUDENT_STR)
    
            const student = await Student.findByPk(req.userId);
            checkObj(student, STUDENT_STR, req.userId)
    
            // get student class and check if treasurebox is open before moving forward with transaction
            const studentClass = await Class.findByPk(student.classId);
            checkObj(studentClass, CLASS_STR, student.classId)
    
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
                prizeCost: prize.kudosCost,
                classId: student.classId
            });
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
            
            checkAuth(req, studentSignInType, STUDENT_STR)
    
            const student = await Student.findByPk(req.userId);
            checkObj(student, STUDENT_STR, req.userId)
            
            student.createWish({ prizeId: wishlistInput.prizeId })
        }
    }
};