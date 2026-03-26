module.exports = (sequelize, DataTypes) => {
  const TeacherDayPreference = sequelize.define('TeacherDayPreference', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teacher_id: { type: DataTypes.INTEGER, allowNull: false },
    day_index: { type: DataTypes.INTEGER, allowNull: false, comment: '0=Senin, 1=Selasa, 2=Rabu, 3=Kamis, 4=Jumat, 5=Sabtu' },
    preference_level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2, comment: '1=Tidak disukai, 2=Netral, 3=Disukai' },
  }, { tableName: 'teacher_day_preferences', timestamps: true, underscored: true });
  return TeacherDayPreference;
};
