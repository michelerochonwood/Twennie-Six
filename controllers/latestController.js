const moment = require('moment');
const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const Interview = require('../models/unit_models/interview');
const PromptSet = require('../models/unit_models/promptset');
const Exercise = require('../models/unit_models/exercise');
const Template = require('../models/unit_models/template');
const MemberProfile = require('../models/profile_models/member_profile');
const GroupMemberProfile = require('../models/profile_models/groupmember_profile');
const LeaderProfile = require('../models/profile_models/leader_profile');
 
// Helper: get correct icon path based on unit type
function getUnitTypeIcon(type) {
  const icons = {
    article: '/icons/article.svg',
    video: '/icons/video.svg',
    interview: '/icons/interview.svg',
    promptset: '/icons/promptset.svg',
    exercise: '/icons/exercise.svg',
    template: '/icons/template.svg'
  };
  return icons[type] || '/icons/default-icon.svg';
}

// Helper: resolve author name and image
async function resolveAuthorById(authorId) {
  try {
    let profile = await LeaderProfile.findOne({ leaderId: authorId }).select('profileImage name');
    if (profile) return { name: profile.name || 'Leader', image: profile.profileImage || '/images/default-avatar.png' };

    profile = await GroupMemberProfile.findOne({ memberId: authorId }).select('profileImage name');
    if (profile) return { name: profile.name || 'Group Member', image: profile.profileImage || '/images/default-avatar.png' };

    profile = await MemberProfile.findOne({ memberId: authorId }).select('profileImage name');
    if (profile) return { name: profile.name || 'Member', image: profile.profileImage || '/images/default-avatar.png' };

  } catch (err) {
    console.error('Error resolving author profile:', err);
  }

  return { name: 'Unknown Author', image: '/images/default-avatar.png' };
}

// Controller: Get all Twennie-visible units for the "latest" view
exports.getLatestLibraryItems = async (req, res) => {
    console.log("👤 req.user in latestController:", req.user);
  try {
    const [articles, videos, interviews, promptsets, exercises, templates] = await Promise.all([
      Article.find({ visibility: 'all_members' }).sort({ updated_at: -1 }).lean(),
      Video.find({ visibility: 'all_members' }).sort({ updated_at: -1 }).lean(),
      Interview.find({ visibility: 'all_members' }).sort({ updated_at: -1 }).lean(),
      PromptSet.find({ visibility: 'all_members' }).sort({ updated_at: -1 }).lean(),
      Exercise.find({ visibility: 'all_members' }).sort({ updated_at: -1 }).lean(),
      Template.find({ visibility: 'all_members' }).sort({ updated_at: -1 }).lean(),
    ]);

    const allLibraryUnits = [
      ...articles.map((unit) => ({ title: unit.article_title, ...unit, type: 'article' })),
      ...videos.map((unit) => ({ title: unit.video_title, ...unit, type: 'video' })),
      ...interviews.map((unit) => ({ title: unit.interview_title, ...unit, type: 'interview' })),
      ...promptsets.map((unit) => ({
        title: unit.promptset_title,
        ...unit,
        type: 'promptset',
        targetAudience: unit.target_audience,
        characteristics: unit.characteristics,
        purpose: unit.purpose,
        suggestedFrequency: unit.suggested_frequency,
      })),
      ...exercises.map((unit) => ({ title: unit.exercise_title, ...unit, type: 'exercise' })),
      ...templates.map((unit) => ({ title: unit.template_title, ...unit, type: 'template' })),
    ];

    allLibraryUnits.sort((a, b) => b.updated_at - a.updated_at);

const startOfThisMonth = moment().startOf('month');
const startOfLastMonth = moment().subtract(1, 'month').startOf('month');
const endOfLastMonth = moment().subtract(1, 'month').endOf('month');

const thisMonthItems = [];
const lastMonthItems = [];

for (const unit of allLibraryUnits) {
  const updatedDate = moment(unit.updated_at);
  const authorId = unit.author?.id || unit.author;

  const author = authorId
    ? await resolveAuthorById(authorId)
    : { name: 'Unknown Author', image: '/images/default-avatar.png' };

  const enrichedUnit = {
    ...unit,
    authorName: author.name,
    authorImage: author.image,
    unitTypeIcon: getUnitTypeIcon(unit.type)
  };

  if (updatedDate.isSameOrAfter(startOfThisMonth)) {
    thisMonthItems.push(enrichedUnit);
  } else if (updatedDate.isBetween(startOfLastMonth, endOfLastMonth, null, '[]')) {
    lastMonthItems.push(enrichedUnit);
  }
}

    const user = req.user;

    res.render('latest_view/latest_view', {
      layout: 'bytopiclayout',
  thisMonthItems,
      lastMonthItems,
      loggedIn: !!user,
      membershipType: user?.membershipType || null,
      accessLevel: user?.accessLevel || null
    });

  } catch (error) {
    console.error('❌ Error in getLatestLibraryItems:', error);
    res.status(500).render('error', {
      layout: 'mainlayout',
      title: 'Error loading library',
      message: 'There was a problem loading the latest additions to the library. Please try again later.'
    });
  }
};





