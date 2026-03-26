module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teacher_id: { type: DataTypes.INTEGER, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    class_id: { type: DataTypes.INTEGER, allowNull: false },
    academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'assignments',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['teacher_id', 'subject_id', 'class_id', 'academic_year_id'] }]
  });
  return Assignment;
};
