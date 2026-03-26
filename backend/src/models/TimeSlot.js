module.exports = (sequelize, DataTypes) => {
  const TimeSlot = sequelize.define('TimeSlot', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    slot_index: { type: DataTypes.INTEGER, allowNull: false },
    day_index: { type: DataTypes.INTEGER, allowNull: false, comment: '0=Senin..5=Sabtu' },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    category: { type: DataTypes.ENUM('lesson', 'break', 'prayer'), allowNull: false, defaultValue: 'lesson' },
    label: { type: DataTypes.STRING(50), allowNull: true },
  }, { tableName: 'time_slots', timestamps: true, underscored: true });
  return TimeSlot;
};
