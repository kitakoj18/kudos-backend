const { gql } = require('apollo-server-express');

const typeDefs = gql`

    type Student {
        id: Int!
        firstName: String!
        lastName: String!
        username: String!
        imageUrl: String
        biography: String
        favoriteSubject: String
        kudosBalance: Int!
        classId: Int!
        transactions: [Transaction!]!
        wishList: [Wish!]!
    }

    type Prize {
        id: Int!
        name: String!
        imageUrl: String!
        description: String
        category: String
        kudosCost: Int!
        quantity: Int!
        classId: Int!
    }

    type Transaction {
        id: Int!
        approved: Boolean!
        prizeId: Int!
        prizeName: String!
        prizeImageUrl: String!
        prizeCost: Int!
        studentId: Int!
    }

    type Wish {
        id: Int!
        prizeAvailable: Boolean!
    }

    type Class {
        id: Int!
        className: String!
        imageUrl: String
        teacherId: Int!
        treasureBoxOpen: Boolean!
        students: [Student!]!
        prizes: [Prize!]!
    }

    type Teacher {
        id: Int!
        firstName: String!
        lastName: String!
        username: String!
        email: String!
        imageUrl: String
        biography: String
        classes: [Class!]
    }

    type AuthData {
        accessToken: String!
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
        firstName: String
        lastName: String
        username: String!
        password: String!
        classId: Int
    }

    input DeleteStudentsData {
        studentIds: [Int!]!
    }

    input PrizeInputData {
        name: String!
        imageUrl: String!
        kudosCost: Int!
        description: String
        category: String
        quantity: Int!
        classId: Int
        prizeId: Int
    }

    input AdjustedBalance {
        studentId: Int!
        newBalance: Int!
    }

    input PrizeTransactionInputData {
        prizeId: Int!
    }

    input ApproveTransactionInputData {
        transactionId: Int!
        transactionApproved: Boolean!
    }

    type Query {
        teacher: Teacher!
        getClassInfo(classId: Int!): Class!
        student: Student!
    }

    type Mutation {
        loginTeacher(teacherInput: TeacherInputData): AuthData!
        loginStudent(studentInput: StudentInputData): AuthData!
        createTeacher(teacherInput: TeacherInputData): Teacher
        createClass(classInput: ClassInputData): Class
        createStudent(studentInput: StudentInputData): Student
        deleteStudents(studentInput: DeleteStudentsData): Student
        createPrize(prizeInput: PrizeInputData): Prize
        editPrize(prizeInput: PrizeInputData): Prize
        adjustStudentBalance(adjustedBalanceData: AdjustedBalance): Student!
        toggleTreasureBox(classId: Int!): Boolean
        approveTransaction(approveInput: ApproveTransactionInputData): Transaction
        postTransaction(transactionInput: PrizeTransactionInputData): Transaction
        addToWishlist(wishlistInput: PrizeTransactionInputData): Prize
    }
`;

module.exports = typeDefs;