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
    refPath: 'createdByModel', // Dynamic reference to the model
  },
  createdByModel: {
    type: String,
    required: true,
    enum: ['member', 'group_member', 'leader'], // Allowed models
  },
  associatedUnits: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'unitType', // Dynamic reference to unit type
  }],
  unitType: {
    type: String,
    enum: ['article', 'video', 'interview', 'promptset', 'exercise', 'template'], // Unit types
  },
  assignedTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'GroupMember'
},
notes: {
  type: String,
  trim: true,
  default: ''
},
  associatedTopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  }],


}, { timestamps: true }); // Automatically add createdAt and updatedAt fields

module.exports = mongoose.model('Tag', tagSchema);
