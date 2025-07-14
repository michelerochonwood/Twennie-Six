const mongoose = require('mongoose');

const promptSetSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['in progress', 'submitted for approval', 'approved'],
    required: true,
    default: 'in progress',
  },
  visibility: {
    type: String,
    required: true,
    enum: ['team_only', 'organization_only', 'all_members'],
    default: 'all_members'
  },
  promptset_title: {
    type: String,
    required: true,
    trim: true,
  },
  main_topic: {
    type: String,
    required: true,
    enum: [
      'Career Development in Technical Services',
      'Soft Skills in Technical Environments',
      'Project Management',
      'Business Development in Technical Services',
      'Finding Projects Before they Become RFPs',
      'Un-Commoditizing Your Services by Delivering What Clients Truly Value',
      'Proposal Management',
      'Proposal Strategy',
      'Storytelling in Technical Marketing',
      'Client Experience',
      'Social Media, Advertising, and Other Mysteries',
      'Pull Marketing',
      'Emotional Intelligence',
      'The Pareto Principle or 80/20',
      'People Before Profit',
      'Non-Technical Roles in Technical Environments',
      'Leadership in Technical Services',
      'The Advantage of Failure',
      'Social Entrepreneurship',
      'Employee Experience',
      'Project Management Software',
      'CRM Platforms',
      'Client Feedback Software',
      'Workplace Culture',
      'Mental Health in Consulting Environments',
      'Remote and Hybrid Work',
      'Four Day Work Week',
      'The Power of Play in the Workplace',
      'Team Building in Consulting',
      'AI in Consulting',
      'AI in Project Management',
      'AI in Learning',
    ],
  },
  secondary_topics: [
    {
      type: String,
      enum: [
        'Career Development in Technical Services',
        'Soft Skills in Technical Environments',
        'Project Management',
        'Business Development in Technical Services',
        'Finding Projects Before they Become RFPs',
        'Un-Commoditizing Your Services by Delivering What Clients Truly Value',
        'Proposal Management',
        'Proposal Strategy',
        'Storytelling in Technical Marketing',
        'Client Experience',
        'Social Media, Advertising, and Other Mysteries',
        'Pull Marketing',
        'Emotional Intelligence',
        'The Pareto Principle or 80/20',
        'People Before Profit',
        'Non-Technical Roles in Technical Environments',
        'Leadership in Technical Services',
        'The Advantage of Failure',
        'Social Entrepreneurship',
        'Employee Experience',
        'Project Management Software',
        'CRM Platforms',
        'Client Feedback Software',
        'Workplace Culture',
        'Mental Health in Consulting Environments',
        'Remote and Hybrid Work',
        'Four Day Work Week',
        'The Power of Play in the Workplace',
        'Team Building in Consulting',
        'AI in Consulting',
        'AI in Project Management',
        'AI in Learning',
      ],
    },
  ],
  sub_topic: { type: String, trim: true },
  target_audience: {
    type: String,
    enum: ['individual', 'group', 'mixed'],
  },
  characteristics: {
    type: [String],
    enum: [
      'educational',
      'motivational',
      'provocative',
      'fun',
      'hilarious',
      'silly',
      'competitive',
      'restorative',
      'energizing',
      'relationship-building',
      'team building',
      'stress-relieving',
      'insightful',
      'calming',
      'reassuring',
      'encouraging',
      'creative',
      'imaginative',
      'heart-warming',
      'other',
    ],
  },
  purpose: { type: String, trim: true, maxlength: 1000 },
  suggested_frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
  },
  // Starting prompt (Prompt0)
  prompt_headline0: { type: String, maxlength: 255, required: true },
  Prompt0: { type: String, maxlength: 1000, required: true },
  // Prompts 1 to 20 and their headlines
  prompt_headline1: { type: String, maxlength: 255, required: true },
  Prompt1: { type: String, maxlength: 1000, required: true },
  prompt_headline2: { type: String, maxlength: 255, required: true },
  Prompt2: { type: String, maxlength: 1000, required: true },
  prompt_headline3: { type: String, maxlength: 255, required: true },
  Prompt3: { type: String, maxlength: 1000, required: true },
  prompt_headline4: { type: String, maxlength: 255, required: true },
  Prompt4: { type: String, maxlength: 1000, required: true },
  prompt_headline5: { type: String, maxlength: 255, required: true },
  Prompt5: { type: String, maxlength: 1000, required: true },
  prompt_headline6: { type: String, maxlength: 255, required: true },
  Prompt6: { type: String, maxlength: 1000, required: true },
  prompt_headline7: { type: String, maxlength: 255, required: true },
  Prompt7: { type: String, maxlength: 1000, required: true },
  prompt_headline8: { type: String, maxlength: 255, required: true },
  Prompt8: { type: String, maxlength: 1000, required: true },
  prompt_headline9: { type: String, maxlength: 255, required: true },
  Prompt9: { type: String, maxlength: 1000, required: true },
  prompt_headline10: { type: String, maxlength: 255, required: true },
  Prompt10: { type: String, maxlength: 1000, required: true },
  prompt_headline11: { type: String, maxlength: 255, required: true },
  Prompt11: { type: String, maxlength: 1000, required: true },
  prompt_headline12: { type: String, maxlength: 255, required: true },
  Prompt12: { type: String, maxlength: 1000, required: true },
  prompt_headline13: { type: String, maxlength: 255, required: true },
  Prompt13: { type: String, maxlength: 1000, required: true },
  prompt_headline14: { type: String, maxlength: 255, required: true },
  Prompt14: { type: String, maxlength: 1000, required: true },
  prompt_headline15: { type: String, maxlength: 255, required: true },
  Prompt15: { type: String, maxlength: 1000, required: true },
  prompt_headline16: { type: String, maxlength: 255, required: true },
  Prompt16: { type: String, maxlength: 1000, required: true },
  prompt_headline17: { type: String, maxlength: 255, required: true },
  Prompt17: { type: String, maxlength: 1000, required: true },
  prompt_headline18: { type: String, maxlength: 255, required: true },
  Prompt18: { type: String, maxlength: 1000, required: true },
  prompt_headline19: { type: String, maxlength: 255, required: true },
  Prompt19: { type: String, maxlength: 1000, required: true },
  prompt_headline20: { type: String, maxlength: 255, required: true },
  Prompt20: { type: String, maxlength: 1000, required: true },
  clarify_topic: { type: Boolean, default: false },
  topics_and_enlightenment: { type: Boolean, default: false },
  challenge: { type: Boolean, default: false },
  instructions: { type: Boolean, default: false },
  time: { type: Boolean, default: false },
  permission: { type: Boolean, required: true },
  short_summary: { type: String, required: true, maxlength: 300 },
full_summary: {
  type: String,
  required: false, // now optional
  maxlength: 1000,
  trim: true
},

  // NEW badge subdocument
  badge: {
    image: { type: String, trim: true },
    name: { type: String, trim: true }
  },

  author: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Middleware to update `updated_at`
promptSetSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

const PromptSet = mongoose.model('PromptSet', promptSetSchema);
module.exports = PromptSet;






