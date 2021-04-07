'use strict';

module.exports = {
  up(queryInterface, Sequelize){
    queryInterface.addColumn('Transaction')
  },

  down(queryInterface, Sequelize){
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
