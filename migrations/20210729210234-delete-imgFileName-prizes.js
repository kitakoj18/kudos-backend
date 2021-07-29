'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('prizes', 'imgFileName')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('prizes', 'imgFileName', {
      type: Sequelize.STRING
    })
  }
};

