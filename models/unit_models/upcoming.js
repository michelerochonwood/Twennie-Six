// models/library_models/upcoming_unit.js
const mongoose = require('mongoose');

const TOPIC_ENUM = [
  'Career Development in Technical Services',
  'Soft Skills in Technical Environments',
  'Project Management',
  'Business Development in Technical Services',
  'Finding Projects Before they Become RFPs',
  'Un-Commoditizing Your Services by Delivering What Clients Truly Value',
  'Proposal Management',
  'Proposal Strategy',
  'Designing a Proposal Process',
  'Conducting Color Reviews of Proposals',
  'Storytelling in Technical Marketing',
  'Client Experience',
  'Social Media, Advertising, and Other Mysteries',
  'Pull Marketing',
  'Emotional Intelligence',
  'The Pareto Principle or 80/20',
  'People Before Profit',
  'Non-Technical Roles in Technical Environments',
  'Leadership in Technical Services',
  'Leading Change',
  'Leading Groups on Twennie',
  'The Advantage of Failure',
  'Social Entrepreneurship',
  'Employee Experience',
  'Project Management Software',
  'CRM Platforms',
  'Client Feedback Software',
  'Workplace Culture',
  'Mental Health in Consulting Environments',
  'Remote and Hybrid Work',
  'The Power of Play in the Workplace',
  'Team Building in Consulting',
  'AI in Consulting',
  'AI in Project Management',
  'AI in Learning',
];

const UNIT_TYPE = [
  'article',
  'video',
  'interview',
  'exercise',
  'template',
  'prompt_set',
  'micro_course',
  'micro_study',
  'peer_coaching'
];

const UPCOMING_STATUS = ['in production', 'released', 'cancelled'];

const upcomingUnitSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: UPCOMING_STATUS,
    required: true,
    default: 'in production',
  },
  visibility: {
    type: String,
    required: true,
    enum: ['team_only', 'organization_only', 'all_members'],
    default: 'all_members',
  },

  unit_type: {
    type: String,
    enum: UNIT_TYPE,
    required: true,
  },

  // Marketing/display title now (mirrors naming style but distinct from Article)
  title: {
    type: String,
    required: true,
    trim: true,
  },

  main_topic: {
    type: String,
    required: true,
    enum: TOPIC_ENUM,
  },
  secondary_topics: [{
    type: String,
    enum: TOPIC_ENUM,
  }],
  sub_topic: { type: String, trim: true },

  // Teasers for cards/landing
  teaser: { type: String, maxlength: 300, trim: true },
  long_teaser: { type: String, maxlength: 1000, trim: true },

  // Promo image
  image: {
    public_id: { type: String, default: null },
    url: { type: String, default: '/images/default-upcoming.png' },
    alt: { type: String, trim: true, default: '' },
  },

  // Scheduling
  projected_release_at: { type: Date, required: true },

  // Tags (same model as elsewhere)
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'tag',
  }],

  // “Notify me” followers (for dashboard icon/badge)
  interested_members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'member',
    index: true,
  }],

  // Link to real unit once released (so dashboards auto-switch)
  published_unit_ref: {
    model: { type: String, enum: UNIT_TYPE.concat(['other']) },
    id: { type: mongoose.Schema.Types.ObjectId, default: null },
  },

  // Display controls
  is_featured: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },

  // Audit
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { minimize: true });

// Update timestamp
upcomingUnitSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Helpful indexes
upcomingUnitSchema.index({ status: 1, projected_release_at: 1 });
upcomingUnitSchema.index({ main_topic: 1, unit_type: 1 });
upcomingUnitSchema.index({ is_featured: 1, priority: -1, projected_release_at: 1 });

// Convenience virtual
upcomingUnitSchema.virtual('interest_count').get(function () {
  return (this.interested_members || []).length;
});

const UpcomingUnit = mongoose.models.UpcomingUnit
  || mongoose.model('UpcomingUnit', upcomingUnitSchema);

module.exports = UpcomingUnit;
