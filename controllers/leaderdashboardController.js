const GroupMember = require('../models/member_models/group_member');
const Leader = require('../models/member_models/leader');
const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const PromptSet = require('../models/unit_models/promptset');
const PromptSetRegistration = require('../models/prompt_models/promptsetregistration');
const PromptSetProgress = require('../models/prompt_models/promptsetprogress');
const AssignPromptSet = require('../models/prompt_models/assignpromptset');
const Interview = require('../models/unit_models/interview');
const Exercise = require('../models/unit_models/exercise');
const Template = require('../models/unit_models/template');
const Tag = require('../models/tag');
const path = require('path'); // ✅ Fix for "ReferenceError: path is not defined"
const fs = require('fs'); // ✅ Ensure file system functions work
const PromptSetCompletion = require('../models/prompt_models/promptsetcompletion');
const LeaderProfile = require('../models/profile_models/leader_profile');
const GroupMemberProfile = require('../models/profile_models/groupmember_profile');







async function resolveAuthorById(authorId) {
    try {
        // Leader profile
        let profile = await LeaderProfile.findOne({ leaderId: authorId }).select('profileImage name');
        if (profile) return { name: profile.name || 'Leader', image: profile.profileImage || '/images/default-avatar.png' };

        // Group member profile
        profile = await GroupMemberProfile.findOne({ memberId: authorId }).select('profileImage name');
        if (profile) return { name: profile.name || 'Group Member', image: profile.profileImage || '/images/default-avatar.png' };
    } catch (err) {
        console.error('resolveAuthorById failed:', err);
    }

    return { name: 'Unknown Author', image: '/images/default-avatar.png' };
}


async function fetchTaggedUnits(userId) {
    try {
        const tags = await Tag.find({ createdBy: userId }).lean();
        if (!tags.length) return [];
        const unitIds = tags.flatMap(tag => tag.associatedUnits);

        const [taggedArticles, taggedVideos, taggedPromptSets, taggedInterviews, taggedExercises, taggedTemplates] = await Promise.all([
            Article.find({ _id: { $in: unitIds } }).lean(),
            Video.find({ _id: { $in: unitIds } }).lean(),
            PromptSet.find({ _id: { $in: unitIds } }).lean(),
            Interview.find({ _id: { $in: unitIds } }).lean(),
            Exercise.find({ _id: { $in: unitIds } }).lean(),
            Template.find({ _id: { $in: unitIds } }).lean(),
        ]);

        return [
            ...taggedArticles.map(unit => ({
                unitType: 'article', 
                title: unit.article_title || "Untitled Article",
                mainTopic: unit.main_topic || "No topic",
                _id: unit._id
            })),
            ...taggedVideos.map(unit => ({
                unitType: 'video',
                title: unit.video_title || "Untitled Video",
                mainTopic: unit.main_topic || "No topic",
                _id: unit._id
            })),
            ...taggedPromptSets.map(unit => ({
                unitType: 'promptset',
                title: unit.promptset_title || "Untitled Prompt Set",
                mainTopic: unit.main_topic || "No topic",
                _id: unit._id
            })),
            ...taggedInterviews.map(unit => ({
                unitType: 'interview',
                title: unit.interview_title || "Untitled Interview",
                mainTopic: unit.main_topic || "No topic",
                _id: unit._id
            })),
            ...taggedExercises.map(unit => ({
                unitType: 'exercise',
                title: unit.exercise_title || "Untitled Exercise",
                mainTopic: unit.main_topic || "No topic",
                _id: unit._id
            })),
            ...taggedTemplates.map(unit => ({
                unitType: 'template',
                title: unit.template_title || "Untitled Template",
                mainTopic: unit.main_topic || "No topic",
                _id: unit._id
            }))
        ];
    } catch (error) {
        console.error("Error fetching tagged units:", error);
        return [];
    }
}

const topicMappings = {
    'AI in Consulting': 'aiinconsulting',
    'AI in Project Management': 'aiinprojectmanagement',
    'AI in Adult Learning': 'aiinadultlearning',
    'Project Management': 'projectmanagement',
    'Workplace Culture': 'workplaceculture',
    'The Pareto Principle': 'theparetoprinciple',
    'Career Development in Technical Services': 'careerdevelopmentintechnicalservices',
    'Soft Skills in Technical Environments': 'softskillsintechnicalenvironments',
    'Business Development in Technical Services': 'businessdevelopmentintechnicalservices',
    'Proposal Management': 'proposalmanagement',
    'Proposal Strategy': 'proposalstrategy',
    'Storytelling in Technical Marketing': 'storytellingintechnicalmarketing',
    'Client Experience': 'clientexperience',
    'Social Media, Advertising, and Other Mysteries': 'socialmediaadvertisingandothermysteries',
    'Emotional Intelligence': 'emotionalintelligence',
    'Diversity and Inclusion in Consulting': 'diversityandinclusioninconsulting',
    'People Before Profit': 'peoplebeforeprofit',
    'Non-Technical Roles in Technical Environments': 'nontechnicalrolesintechnicalenvironments',
    'Leadership in Technical Services': 'leadershipintechnicalservices',
    'The Advantage of Failure': 'theadvantageoffailure',
    'Social Entrepreneurship': 'socialentrepreneurship',
    'Employee Experience': 'employeeexperience',
    'Project Management Software': 'projectmanagementsoftware',
    'CRM Platforms': 'crmplatforms',
    'Client Feedback Software': 'clientfeedbacksoftware',
    'Mental Health in Consulting Environments': 'mentalhealthinconsultingenvironments',
    'Remote or Hybrid Work': 'remoteorhybridwork',
    'Four Day Work Week': 'fourdayworkweek',
    'The Power of Play in the Workplace': 'thepowerofplayintheworkplace',
    'Team Building in Technical Consulting': 'teambuildingintechnicalconsulting',
};

// Mapping topic slugs to their corresponding view filenames
const topicViewMappings = {
    'aiinconsulting': 'single_topic_aiconsulting',
    'aiinadultlearning': 'single_topic_ailearn',
    'aiinprojectmanagement': 'single_topic_aiprojectmgmt',
    'businessdevelopmentintechnicalservices': 'single_topic_bd',
    'careerdevelopmentintechnicalservices': 'single_topic_careerdev',
    'clientexperience': 'single_topic_clientex',
    'clientfeedbacksoftware': 'single_topic_clientfeedback',
    'crmplatforms': 'single_topic_crm',
    'diversityandinclusioninconsulting': 'single_topic_diversity',
    'emotionalintelligence': 'single_topic_emotionali',
    'employeeexperience': 'single_topic_employeeex',
    'theadvantageoffailure': 'single_topic_failure',
    'fourdayworkweek': 'single_topic_fourday',
    'leadershipintechnicalservices': 'single_topic_leadership',
    'mentalhealthinconsultingenvironments': 'single_topic_mental',
    'nontechnicalrolesintechnicalenvironments': 'single_topic_nontechnical',
    'theparetoprinciple': 'single_topic_pareto',
    'peoplebeforeprofit': 'single_topic_peoplebefore',
    'thepowerofplayintheworkplace': 'single_topic_play',
    'projectmanagementsoftware': 'single_topic_pmsoftware',
    'projectmanagement': 'single_topic_projectmgmt',
    'proposalmanagement': 'single_topic_proposalmgmt',
    'proposalstrategy': 'single_topic_proposalstrat',
    'remoteorhybridwork': 'single_topic_remote',
    'socialentrepreneurship': 'single_topic_social',
    'socialmediaadvertisingandothermysteries': 'single_topic_socialmedia',
    'softskillsintechnicalenvironments': 'single_topic_softskills',
    'storytellingintechnicalmarketing': 'single_topic_storytelling',
    'teambuildingintechnicalconsulting': 'single_topic_teambuilding',
    'workplaceculture': 'single_topic_workplaceculture'
};

// Function to resolve unit type
function resolveUnitType(unit) {
    if (unit.article_title) return "Article";
    if (unit.video_title) return "Video";
    if (unit.interview_title) return "Interview";
    if (unit.exercise_title) return "Exercise";
    if (unit.template_title) return "Template";
    if (unit.promptset_title) return "Prompt Set";
    
    // Backup: Use Mongoose model name if available
    return unit.constructor?.modelName || "Unknown";
}


// Function to get subtopics from topics.json
function getSubtopics(topicTitle) {
    const topicsFilePath = path.join(__dirname, '../public/data/topics.json'); // ✅ Now path is defined

    if (!fs.existsSync(topicsFilePath)) {
        console.error('topics.json file is missing.');
        return [];
    }

    const topicsData = JSON.parse(fs.readFileSync(topicsFilePath, 'utf8'));
    const topic = topicsData.topics.find(t => t.title === topicTitle);

    return topic ? topic.subtopics : []; // ✅ Return an empty array if no subtopics found
}




async function getLeaderPromptSchedule(leaderId, promptSetId) {
    let targetDate = null;

    // Check for registration or assignment and get the target completion date
    const registration = await PromptSetRegistration.findOne({ memberId: leaderId, promptSetId });
    if (registration) {
        targetDate = registration.targetCompletionDate;
    } else {
        const assignment = await AssignPromptSet.findOne({ assignedMemberId: leaderId, promptSetId });
        if (assignment) {
            targetDate = assignment.targetCompletionDate;
        }
    }

    if (!targetDate) return null; // No target date found

    const today = new Date();
    targetDate = new Date(targetDate);
    const remainingDays = Math.max(0, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)));

    // Fetch progress and determine remaining prompts
    const progress = await PromptSetProgress.findOne({ memberId: leaderId, promptSetId });

    if (!progress) {
  console.warn(`⚠️ No progress found for promptSetId ${registration.promptSetId}. Showing Prompt 0 fallback.`);
  progress = {
    currentPromptIndex: 0,
    completedPrompts: []
  };
}
    const remainingPrompts = progress && progress.completedPrompts ? 21 - progress.completedPrompts.length : 21;

    const spread = remainingPrompts > 0 ? Math.floor(remainingDays / remainingPrompts) : 0;

    return {
        targetCompletionDate: targetDate.toDateString(),
        recommendedCompletionDate: new Date(today.getTime() + spread * 24 * 60 * 60 * 1000).toDateString(),
        remainingDays,
        remainingPrompts,
        spread
    };
}



module.exports = {
    renderLeaderDashboard: async (req, res) => {

        try {
            const { id } = req.session.user;
            console.log("Fetching dashboard for leader:", id);

            const userData = await Leader.findById(id)
            .select('groupName groupLeaderName profileImage professionalTitle organization topics members')
            .populate({
              path: 'members',
              model: 'GroupMember',
              select: 'name profileImage professionalTitle isVerified'
            })
            .lean();
            const leaderProfile = await LeaderProfile.findOne({ leaderId: id }).select('profileImage');
            const resolvedGroupMembers = await Promise.all(
  (userData.members || []).map(async (member) => {
    const profile = await GroupMemberProfile.findOne({ memberId: member._id }).select('profileImage');
    return {
      ...member,
      profileImage: profile?.profileImage || '/images/default-avatar.png'
    };
  })
);


            const leader = userData; // ✅ Ensures leader is properly defined before usage
            const leaderGroupMembers = userData.members || []; // ✅ Ensures it's always an array
            // Fetch all group members under this leader
            const leaderGroupMemberIds = leaderGroupMembers.map(member => member._id);

            const [groupArticles, groupVideos, groupPromptSets, groupInterviews, groupExercises, groupTemplates] = await Promise.all([
                Article.find({ 'author.id': { $in: leaderGroupMemberIds } }).lean(),
                Video.find({ 'author.id': { $in: leaderGroupMemberIds } }).lean(),
                PromptSet.find({ 'author.id': { $in: leaderGroupMemberIds } }).lean(),
                Interview.find({ 'author.id': { $in: leaderGroupMemberIds } }).lean(),
                Exercise.find({ 'author.id': { $in: leaderGroupMemberIds } }).lean(),
                Template.find({ 'author.id': { $in: leaderGroupMemberIds } }).lean(),
            ]);
            
            const groupMemberUnits = await Promise.all(
                [...groupArticles, ...groupVideos, ...groupPromptSets, ...groupInterviews, ...groupExercises, ...groupTemplates].map(async (unit) => {
                    const author = await resolveAuthorById(unit.author.id);
                    return {
                        unitType: resolveUnitType(unit), // ✅ Now correctly assigns unit type
                        title: unit.article_title || unit.video_title || unit.promptset_title || unit.interview_title || unit.exercise_title || unit.template_title || "Untitled Unit",
                        status: unit.status || "Unknown",
                        mainTopic: unit.main_topic || "No topic",
                        _id: unit._id,
                        author: author.name
                    };
                })
            );
            


            if (!userData) {
                throw new Error(`Leader with ID ${id} not found.`);
            }

            console.log("Fetched leader data:", userData);

            const maxGroupSize = 10;
            userData.maxGroupSize = maxGroupSize;

            const leaderRegistrations = await PromptSetRegistration.find({ memberId: id }).populate('promptSetId');
            console.log(`Total prompt sets found for leader ${id}: ${leaderRegistrations.length}`);
            
            let leaderPrompts = [];
            let promptSchedules = [];
            
            // ✅ Fetch prompt progress from the database instead of using session storage
            await Promise.all(
                leaderRegistrations.map(async (registration) => {
                    const promptSet = await PromptSet.findById(registration.promptSetId);
                    if (!promptSet) return;
            
                    const progress = await PromptSetProgress.findOne({ memberId: id, promptSetId: registration.promptSetId });
            
                    const currentPromptIndex = progress?.currentPromptIndex ?? 0; // ✅ Ensure first prompt is always 0
            
                    console.log(`Progress for promptSetId ${registration.promptSetId._id}: ${currentPromptIndex}`);
            
                    const headlineKey = `prompt_headline${currentPromptIndex}`;
                    const promptKey = `Prompt${currentPromptIndex}`;
            
                    const isCompleted = progress?.completedPrompts?.length >= 20;
            
if (!isCompleted) {
  const currentPromptIndex = progress?.currentPromptIndex ?? 0;
  const headlineKey = `prompt_headline${currentPromptIndex}`;
  const promptKey = `Prompt${currentPromptIndex}`;

  leaderPrompts.push({
    registrationId: registration._id,
    promptSetId: registration.promptSetId._id.toString(),
    promptSetTitle: promptSet.promptset_title,
    frequency: registration.frequency,
    mainTopic: promptSet.main_topic,
    purpose: promptSet.purpose,
    promptIndex: currentPromptIndex,
    promptHeadline: promptSet[headlineKey] || "No headline found",
    promptText: promptSet[promptKey] || "No prompt text found"
  });
}

            
                    promptSchedules.push(await getLeaderPromptSchedule(id, registration.promptSetId));
                })
            );
            
            console.log("Leader Prompts Data:", JSON.stringify(leaderPrompts, null, 2));
            console.log("Prompt schedules:", JSON.stringify(promptSchedules, null, 2));
            
            // ✅ Fetch prompt set progress from MongoDB (No session-based tracking)

// ✅ First fetch completed prompt sets
const completedRecords = await PromptSetCompletion.find({ memberId: id }).populate('promptSetId');

// ✅ Then fetch in-progress prompt records
const progressRecords = await PromptSetProgress.find({ memberId: id }).populate('promptSetId');

const completedIds = new Set(completedRecords.map(record => record.promptSetId._id.toString()));

let currentPromptSets = [];

if (progressRecords.length > 0) {
  progressRecords.forEach(record => {
    const promptSetId = record.promptSetId._id.toString();
    if (!completedIds.has(promptSetId)) {
      const progressPercentage = (record.completedPrompts?.length / 20) * 100 || 0;
      currentPromptSets.push({
        promptSetTitle: record.promptSetId.promptset_title,
        frequency: record.promptSetId.suggested_frequency,
        progress: `${progressPercentage}%`,
        targetCompletionDate: record.promptSetId.target_completion_date || "Not Set",
        promptIndex: record.currentPromptIndex || 0
      });
    }
  });
}



            
            console.log("All session keys before rendering:", Object.keys(req.session));
            // Attach subtopics and slugs for the leader's topics
const selectedTopics = {
    topic1: {
        title: leader.topics.topic1,
        subtopics: getSubtopics(leader.topics.topic1),
        slug: topicMappings[leader.topics.topic1] || 'unknown-topic',
        viewName: topicViewMappings[topicMappings[leader.topics.topic1]] || 'not_found'
    },
    topic2: {
        title: leader.topics.topic2,
        subtopics: getSubtopics(leader.topics.topic2),
        slug: topicMappings[leader.topics.topic2] || 'unknown-topic',
        viewName: topicViewMappings[topicMappings[leader.topics.topic2]] || 'not_found'
    },
    topic3: {
        title: leader.topics.topic3,
        subtopics: getSubtopics(leader.topics.topic3),
        slug: topicMappings[leader.topics.topic3] || 'unknown-topic',
        viewName: topicViewMappings[topicMappings[leader.topics.topic3]] || 'not_found'
    }
};

console.log("Selected Topics for Leader:", selectedTopics);

            

            const leaderTaggedUnits = await fetchTaggedUnits(id);

            const [leaderArticles, leaderVideos, leaderPromptSets, leaderInterviews, leaderExercises, leaderTemplates] = await Promise.all([
                Article.find({ 'author.id': id }),
                Video.find({ 'author.id': id }),
                PromptSet.find({ 'author.id': id }),
                Interview.find({ 'author.id': id }),
                Exercise.find({ 'author.id': id }),
                Template.find({ 'author.id': id }),
            ]);

            const leaderUnits = await Promise.all(
                [...leaderArticles, ...leaderVideos, ...leaderPromptSets, ...leaderInterviews, ...leaderExercises, ...leaderTemplates].map(async (unit) => {
                    const author = await resolveAuthorById(unit.author.id);
                    return {
                        unitType: unit.unitType || unit.constructor?.modelName || 'Unknown',
                        title: unit.article_title || unit.video_title || unit.promptset_title || unit.interview_title || unit.exercise_title || unit.template_title,
                        status: unit.status,
                        mainTopic: unit.main_topic,
                        _id: unit._id,
                        author: author.name
                    };
                })
            );


            
            

            console.log("All session keys before rendering:", Object.keys(req.session));

            // ✅ Remove session-based prompt tracking (Database handles it now)
            
            // ✅ Ensure we are using `getLeaderPromptSchedule()`
            promptSchedules = await Promise.all(
                leaderRegistrations.map(async (registration) => 
                    getLeaderPromptSchedule(id, registration.promptSetId)
                )
            );
            
            console.log("Updated Leader Prompts Data:", JSON.stringify(leaderPrompts, null, 2));
            console.log("Prompt Schedules:", JSON.stringify(promptSchedules, null, 2));
            


// Now fetch completed prompt set records directly from the PromptSetCompletion collection


// Map the completion records to a formatted array
const formattedCompletedSets = completedRecords.map(record => ({
    promptSetTitle: record.promptSetId.promptset_title,
    frequency: record.promptSetId.suggested_frequency,
    mainTopic: record.promptSetId.main_topic,
    completedAt: record.completedAt ? new Date(record.completedAt).toDateString() : "Unknown Date",
    badge: record.earnedBadge // This should now contain an object with { image, name }
}));


return res.render('leader_dashboard', {
  layout: 'dashboardlayout',
  title: 'Leader Dashboard',
  csrfToken: req.csrfToken(), // ✅ Add this line
  leader: {
    ...userData,
    profileImage: leaderProfile?.profileImage || '/images/default-avatar.png'
  },
  leaderGroupMembers: resolvedGroupMembers,
  maxGroupSize: userData.maxGroupSize,
  leaderUnits,
  groupMemberUnits,
  leaderTaggedUnits,
  registeredPromptSets: leaderPrompts,
  promptSchedules,
  currentPromptSets,
  completedPromptSets: formattedCompletedSets,
  selectedTopics
});



            
            
            
            
            
        } catch (err) {
            console.error('Error rendering leader dashboard:', err);
            return res.status(500).render('member_form_views/error', {
                layout: 'mainlayout',
                title: 'Error',
                errorMessage: 'An unexpected error occurred. Please try again later.',
            });
        }
    }
};


