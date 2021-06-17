const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const aws = require('aws-sdk');

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

const s3Bucket = process.env.AWS_S3BUCKET;

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
        },
        getClassPrizes: async function(_, __, { req }){

            checkAuth(req, studentSignInType, STUDENT_STR)

            const studentClassId = req.classId
            console.log(studentClassId)
            const classPrizes = await Prize.findAll({
                where: {
                    classId: studentClassId
                }
            })

            let prizeArray = []
            for(prize of classPrizes){
                prizeArray.push(prize.toJSON())
            }

            return prizeArray
        }
    },
    Mutation: {
        loginUser: async function(_, { userInput }, { res }){

            const username = userInput.username
            const password = userInput.password
            const userType = userInput.userType
            let signInType
            let user
            let classId
            if(userType === 'teacher'){
                signInType = teacherSignInType
                user = await Teacher.findOne({where: {username: username}})
                classId = 'undefined'
            } else {
                signInType = studentSignInType
                user = await Student.findOne({where: {username: username}})
                classId = user.classId
            }

            if(!user){
                const error = new Error(`${userType} with this username does not exist!`)
                error.code = 401
                throw error
            }
    
            const validPassword = await bcrypt.compare(password, user.password);
            if(!validPassword) {
                const error = new Error('Incorrect password. Please try again.');
                error.code = 401;
                throw error;
            }

            const acsToken = createAccessToken(user.id.toString(), signInType, classId);
            const rfrshToken = createRefreshToken(user.id.toString(), signInType, classId);

            sendRefreshToken(res, rfrshToken);
    
            return {accessToken: acsToken, userId: user.id};
        }, 
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
        createClass: async function(_, { classInput }, { req }){
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const teacher = await Teacher.findByPk(req.userId);
            checkObj(teacher, TEACHER_STR, req.userId)
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
                imageUrl: studentInput.imageUrl,
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

            const hashedPw = await bcrypt.hash(studentInput.password, 12);
            student.password = hashedPw
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
        deletePrizes: async function(_, { prizeInput }, { req }){

            checkAuth(req, teacherSignInType, TEACHER_STR)

            Prize.destroy({ where: { id: prizeInput.prizeIds } })
        },
        createCategory: async function(_, { categoryName }, { req }){

            checkAuth(req, teacherSignInType, TEACHER_STR)

            const teacher = await Teacher.findByPk(req.userId);
            checkObj(teacher, TEACHER_STR, req.userId);
            teacher.createCategory({ category: categoryName });
        },
        adjustStudentBalance: async function(_, { adjustedBalanceData }, { req }){
    
            checkAuth(req, teacherSignInType, TEACHER_STR)
    
            const student = await Student.findByPk(adjustedBalanceData.studentId);
            checkObj(student, STUDENT_STR, adjustedBalanceData.studentId)
    
            student.kudosBalance = adjustedBalanceData.newBalance;
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

        },
        addToWishlist: async function(_, { wishlistInput }, { req }){
            
            checkAuth(req, studentSignInType, STUDENT_STR)
    
            const student = await Student.findByPk(req.userId);
            checkObj(student, STUDENT_STR, req.userId)
            
            student.createWish({ prizeId: wishlistInput.prizeId })
        },
        signS3: async function(_, { fileName, fileType }, { req }){
            
            checkAuth(req, teacherSignInType, TEACHER_STR)

            const s3 = new aws.S3({
                signatureVersion: 'v4',
                region: 'us-west-1'
            })

            const s3Params = {
                Bucket: s3Bucket,
                Key: fileName,
                Expires: 60,
                ContentType: fileType,
                ACL: 'public-read'
            }

            const signedRequest = await s3.getSignedUrl('putObject', s3Params)
            const url = `https://${s3Bucket}.s3.amazonaws.com/${fileName}`

            return { signedRequest, url }
        }
    }
};