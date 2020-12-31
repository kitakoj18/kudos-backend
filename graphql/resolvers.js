const Teacher = require('../models/teacher');
const Class = require('../models/class');
const Student = require('../models/student');
const Prize = require('../models/prize');
const Transaction = require('../models/transaction');

module.exports = {
    teacher: async function(args, req){
        const teacherId = req.teacher.id;
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
    adjustStudentBalance: async function({ adjustedBalanceData }, req){

        const student = await Student.findByPk(adjustedBalanceData.studentId);
        student.balance = adjustedBalanceData.newBalance;
        await student.save();
        return student;

    },
    postTransaction: async function({ transactionInput }, req){

        const student = await Student.findByPk(transactionInput.studentId);
        // create transaction tied to the student
        await student.createTransaction({prizeId: transactionInput.prizeId});
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
        const prizeCost = prize.kudosCost;
        student.kudosBalance += prizeCost;
        await student.save();

        return transaction;

    }
};