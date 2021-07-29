'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('prizes', 'teacherId')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('prizes', 'teacherId', {
      type: Sequelize.INTEGER
    })
  }
};
