'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('prizes', 'category')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('prizes', 'category', {
      type: Sequelize.STRING
    })
  }
};

