'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('transactions', 'givenDate', {
      type: Sequelize.DATE
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('transactions', 'givenDate')
  }
};
