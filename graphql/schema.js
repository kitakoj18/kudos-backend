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
        username: String!
        email: String!
        imageUrl: String
        biography: String
        classes: [Class!]
    }

    type AuthData {
        token: String!
        userId: Int!
    }

    input TeacherInputData {
        firstName: String
        lastName: String
        username: String!
        email: String
        password: String!
    }

    input ClassInputData {
        className: String!
        imageUrl: String!
    }

    input StudentInputData {
        firstName: String!
        lastName: String!
        email: String!
        password: String!
    }

    input PrizeInputData {
        name: String!
        imageUrl: String!
    }

    input AdjustedBalance {
        studentId: Int!
        newBalance: Int!
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
        loginTeacher(teacherInput: TeacherInputData): AuthData!
    }

    type RootMutation {
        createTeacher(teacherInput: TeacherInputData): Teacher
        createClass(classInput: ClassInputData): Class
        createStudent(studentInput: StudentInputData): Student!
        createPrize(prizeInput: PrizeInputData): Prize!
        adjustStudentBalance(adjustedBalanceData: AdjustedBalance): Student!
        toggleTreasureBox(classId: Int!): Boolean
        approveTransaction(approveInput: ApproveTransactionInputData): Transaction
        postTransaction(transactionInput: PostTransactionInputData): Transaction
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);