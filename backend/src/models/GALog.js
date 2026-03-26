module.exports = (sequelize, DataTypes) => {
  const GALog = sequelize.define('GALog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    schedule_job_id: { type: DataTypes.INTEGER, allowNull: false },
    generation: { type: DataTypes.INTEGER, allowNull: false },
    best_fitness: { type: DataTypes.FLOAT, allowNull: false },
    avg_fitness: { type: DataTypes.FLOAT, allowNull: false },
    hard_violations: { type: DataTypes.INTEGER, allowNull: true },
    soft_violations: { type: DataTypes.INTEGER, allowNull: true },
  }, { tableName: 'ga_logs', timestamps: true, underscored: true });
  return GALog;
};
