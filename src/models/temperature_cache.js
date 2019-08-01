'use strict';
module.exports = (sequelize, DataTypes) => {
  const temperature_cache = sequelize.define('temperature_cache', {
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    temperature: DataTypes.FLOAT,
    expires: DataTypes.BIGINT
  }, {freezeTableName: true});
  temperature_cache.associate = function(models) {
    // associations can be defined here
  };
  return temperature_cache;
};
