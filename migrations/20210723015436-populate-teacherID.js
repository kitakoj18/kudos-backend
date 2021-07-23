'use strict';

const Class = require('../models/class')
const Prize = require('../models/prize')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction()
    try {

      const prizes = await Prize.findAll()
      for await (const prize of prizes){
        console.log(prize.toJSON())
        const classId = await prize.toJSON().classId
        const cls = await Class.findByPk(classId)

        //console.log(cls.teacherId)
        await prize.update({ teacherId: cls.teacherId })
      }

      await t.commit()

    } catch(err){
      await t.rollback()
      //console.log('something went wrong; prize teacherId did not populate')
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
