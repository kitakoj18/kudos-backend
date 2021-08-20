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
        class: Class!
        transactions: [Transaction!]
        wishes: [Wish!]
    }

    type Prize {
        id: Int!
        name: String!
        imageUrl: String
        description: String
        category: Category!
        kudosCost: Int!
        quantity: Int!
        classId: Int!
    }

    type Transaction {
        id: Int!
        approved: Boolean!
        prizeId: Int!
        prizeName: String!
        prizeImageUrl: String
        prizeCost: Int!
        studentId: Int!
    }

    type Wish {
        id: Int!
        studentId: Int!
        prize: Prize!
    }

    type Class {
        id: Int!
        className: String!
        imageUrl: String
        teacherId: Int!
        treasureBoxOpen: Boolean!
        students: [Student!]
        prizes: [Prize!]
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
        categories: [Category!]
    }

    type Category {
        id: Int!
        category: String!
    }

    type AuthData {
        accessToken: String!
        userId: Int!
    }

    type S3Payload {
        signedRequest: String!
        url: String!
    }

    input UserLoginData {
        username: String!
        password: String!
        userType: String!
    }

    input TeacherInputData {
        firstName: String
        lastName: String
        username: String
        email: String
        password: String
    }

    input ClassInputData {
        id: Int
        className: String
        imageUrl: String
    }

    input EditClassInput {
        id: Int!
        className: String!
    }

    input StudentInputData {
        id: Int
        firstName: String
        lastName: String
        username: String
        password: String
        imageUrl: String
        classId: Int
    }

    input DeleteStudentsData {
        studentIds: [Int!]!
    }

    input PrizeInputData {
        name: String!
        imageUrl: String
        kudosCost: Int!
        description: String
        category: String
        quantity: Int!
        classId: Int
        prizeId: Int
        categoryId: Int!
    }

    input DeletePrizesData {
        prizeIds: [Int!]!
    }

    input AdjustedBalance {
        studentId: Int!
        newBalance: Int!
    }

    input EditCategory {
        id: Int!
        name: String!
    }

    input DeleteCategoryData {
        id: Int!
        replaceId: Int!
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
        getClasses: [Class]!
        student: Student!
        getClassPrizes: [Prize]!
    }

    type Mutation {
        loginUser(userInput: UserLoginData): AuthData!
        createTeacher(teacherInput: TeacherInputData): Teacher
        editTeacher(teacherInput: TeacherInputData): Teacher
        createClass(classInput: ClassInputData): Class
        editClasses(classInput: [EditClassInput]!): [Class]
        deleteClass(classInput: ClassInputData): Class
        createStudent(studentInput: StudentInputData): Student
        editStudent(studentInput: StudentInputData): Student
        deleteStudents(studentInput: DeleteStudentsData): Student
        createPrize(prizeInput: PrizeInputData): Prize
        editPrize(prizeInput: PrizeInputData): Prize
        deletePrizes(prizeInput: DeletePrizesData): Prize
        createCategory(categoryName: String!): Category
        editCategories(categoryInput: [EditCategory]!): [Category]
        deleteCategory(categoryInput: DeleteCategoryData): Category
        adjustStudentBalance(adjustedBalanceData: AdjustedBalance): Student!
        toggleTreasureBox(classId: Int!): Boolean
        approveTransaction(approveInput: ApproveTransactionInputData): Transaction
        postTransaction(transactionInput: PrizeTransactionInputData): Transaction
        cancelTransaction(transactionId: Int!): Transaction
        addToWishlist(wishlistInput: PrizeTransactionInputData): Prize
        cancelOrBuyWish(wishId: Int!, prizeId: Int!, actionType: String!): Wish
        signS3(fileName: String!, fileType: String!): S3Payload!
    }
`;

module.exports = typeDefs;