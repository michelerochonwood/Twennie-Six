const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: true
  },
  createdByModel: {
    type: String,
    required: true,
    enum: ['member', 'group_member', 'leader'],
  },
associatedUnits: [{
  item: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'associatedUnits.unitType'
  },
  unitType: {
    type: String,
    required: true,
    enum: ['article', 'video', 'interview', 'promptset', 'exercise', 'template']
  }
}],

  assignedTo: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMember',
      required: true
    },
    instructions: {
      type: String,
      trim: true,
      default: ''
    },
    completedAt: { type: Date, default: null } // ✅ NEW
  }],
  associatedTopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  }]
}, { timestamps: true });

module.exports = mongoose.model('Tag', tagSchema);

