const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  professionalTitle: {
    type: String,
    required: [true, 'Professional title is required'],
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: [
      'Engineering',
      'Architecture',
      'Project Management',
      'Information Technology(IT)',
      'Web Design',
      'Construction',
      'Technology',
      'AI and Robotics',
      'Social Media/Digital Advertising',
      'Community Planning/Landscape Architecture',
      'Land Development',
      'Telecommunications',
      'E-Commerce',
      'Cybersecurity',
      'Fintech',
      'Edtech',
      'Energy and Utilities',
      'Manufacturing',
      'Other'
    ]
  },
username: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  lowercase: true // optional, if you want usernames to be case-insensitive
},
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  topics: {
    topic1: {
      type: String,
    },
    topic2: {
      type: String,
    },
    topic3: {
      type: String,
    }
  },
  profileImage: {
    type: String,
    default: '/images/default-avatar.png',
    trim: true
  },
  accessLevel: {
    type: String,
    required: true,
    enum: [
      'free_individual',
      'contributor_individual',
      'paid_individual'
    ]
  },
  membershipType: {
    type: String,
    default: 'member',
    enum: ['member']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: {
    type: String,
    default: undefined
  },
  resetPasswordExpires: {
    type: Date,
    default: undefined
  }
}, {
  timestamps: true
});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;








