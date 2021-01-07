const { buildSchema } = require('graphql');

module.exports = buildSchema(`

    type Student {
        studentId: Int!
        firstName: String!
        lastName: String!
        email: String!
        imageUrl: String
        biography: String
        favoriteSubject: String
        kudosBalance: Int!
        classId: Int!
        transactions: [Transaction!]!
        wishList: [Wish!]!
    }

    type Prize {
        prizeId: Int!
        name: String!
        imageUrl: String!
        description: String
        kudosCost: Int!
        quantity: Int!
        classId: Int!
    }

    type Transaction {
        id: Int!
        approved: Boolean!
        prizeId: Int!
        studentId: Int!
    }

    type Wish {
        id: Int!
        prizeAvailable: Boolean!
    }

    type Class {
        classId: Int!
        className: String!
        imageUrl: String
        teacherId: Int!
        treasureBoxOpen: Boolean!
        students: [Student!]!
        prizes: [Prize!]!
    }

    type Teacher {
        teacherId: Int!
        firstName: String!
        lastName: String!
        email: String!
        imageUrl: String
        biography: String
        classes: [Class!]!
    }

    input TeacherInputData {
        firstName: String!
        lastName: String!
        email: String!
        imageUrl: String
        biography: String
    }

    input AdjustedBalance {
        studentId: Int!
        newBalance: Int!
    }

    input StudentInputData {
        name: String!
        userName: String!
        password: String!
    }

    input PostTransactionInputData {
        studentId: Int!
        prizeId: Int!
        kudosCost: Int!
    }

    input ApproveTransactionInputData {
        transactionId: Int!
        transactionApproved: Boolean!
    }

    type RootQuery {
        teacher: Teacher!
    }

    type RootMutation {
        createTeacher(teacherInput: TeacherInputData): Teacher!
        adjustStudentBalance(adjustedBalanceData: AdjustedBalance): Student!
        createStudent(studentInput: StudentInputData): Student!
        toggleTreasureBox(classId: Int!): Boolean
        approveTransaction(approveInput: ApproveTransactionInputData): Transaction
        postTransaction(transactionInput: PostTransactionInputData): Transaction
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);