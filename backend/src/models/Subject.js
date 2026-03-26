module.exports = (sequelize, DataTypes) => {
  const Subject = sequelize.define('Subject', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('umum', 'keagamaan'), allowNull: false, defaultValue: 'umum' },
    hours_per_week: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'subjects', timestamps: true, underscored: true });
  return Subject;
};
