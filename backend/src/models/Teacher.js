module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    nip: { type: DataTypes.STRING(30), allowNull: true, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: true },
    max_hours_per_day: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 6 },
    max_hours_per_week: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 24 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'teachers', timestamps: true, underscored: true });
  return Teacher;
};
