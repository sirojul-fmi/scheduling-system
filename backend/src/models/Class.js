module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    grade: { type: DataTypes.INTEGER, allowNull: false, comment: '1-6' },
    name: { type: DataTypes.STRING(20), allowNull: false, comment: 'e.g. I-A, II-B' },
    homeroom_teacher_id: { type: DataTypes.INTEGER, allowNull: true },
    academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
  }, { tableName: 'classes', timestamps: true, underscored: true });
  return Class;
};
