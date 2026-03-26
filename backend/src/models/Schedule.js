module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define('Schedule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    schedule_job_id: { type: DataTypes.INTEGER, allowNull: false },
    class_id: { type: DataTypes.INTEGER, allowNull: false },
    day_index: { type: DataTypes.INTEGER, allowNull: false },
    slot_index: { type: DataTypes.INTEGER, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'schedules',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['schedule_job_id', 'class_id', 'day_index', 'slot_index'] }]
  });
  return Schedule;
};
