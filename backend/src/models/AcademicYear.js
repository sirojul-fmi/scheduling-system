module.exports = (sequelize, DataTypes) => {
  const AcademicYear = sequelize.define('AcademicYear', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    year: { type: DataTypes.STRING(20), allowNull: false, comment: 'e.g. 2025/2026' },
    semester: { type: DataTypes.INTEGER, allowNull: false, comment: '1 or 2' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: 'academic_years', timestamps: true, underscored: true });
  return AcademicYear;
};
