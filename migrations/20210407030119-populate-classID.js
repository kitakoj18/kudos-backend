'use strict';

const Student = require('../models/student');
const Transaction = require('../models/transaction');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction()
    try {
      
      const transactions = await Transaction.findAll()
      for await (const transaction of transactions){
        console.log(transaction.toJSON())
        const studentId = await transaction.toJSON().studentId
        const student = await Student.findByPk(studentId)

        await transaction.update({ classId: student.classId })
      }

      await t.commit()

    } catch(err){
      await t.rollback()
      console.log("something went wrong; transaction classId did not populate")
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
