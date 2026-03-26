module.exports = (sequelize, DataTypes) => {
  const ScheduleJob = sequelize.define('ScheduleJob', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'done', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    ga_params: { type: DataTypes.JSONB, allowNull: true },
    best_fitness: { type: DataTypes.FLOAT, allowNull: true },
    total_generations: { type: DataTypes.INTEGER, allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    finished_at: { type: DataTypes.DATE, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: 'schedule_jobs', timestamps: true, underscored: true });
  return ScheduleJob;
};
