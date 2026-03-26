module.exports = (sequelize, DataTypes) => {
  const SubjectSlotRestriction = sequelize.define('SubjectSlotRestriction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    subject_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    allowed_day_slots: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of {dayIndex, slotIndex} objects'
    },
    restriction_type: {
      type: DataTypes.ENUM('whitelist', 'blacklist'),
      allowNull: false,
      defaultValue: 'whitelist'
    },
  }, { tableName: 'subject_slot_restrictions', timestamps: true, underscored: true });
  return SubjectSlotRestriction;
};
