module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('meetups', 'banner', {
      type: Sequelize.INTEGER,
      references: { model: 'files', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      allowNull: false,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('meetups', 'banner', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
