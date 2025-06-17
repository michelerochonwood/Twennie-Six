const Member = require('../models/member_models/member');
const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const PromptSet = require('../models/unit_models/promptset');
const PromptSetRegistration = require('../models/prompt_models/promptsetregistration');
const PromptSetProgress = require('../models/prompt_models/promptsetprogress');
const Interview = require('../models/unit_models/interview');
const Exercise = require('../models/unit_models/exercise');
const Template = require('../models/unit_models/template');
const Tag = require('../models/tag');
const path = require('path'); // ✅ Fix for "ReferenceError: path is not defined"
const fs = require('fs'); // ✅ Ensure file system functions work
const MemberProfile = require('../models/profile_models/member_profile');
const PromptSetCompletion = require('../models/prompt_models/promptsetcompletion');





async function resolveAuthorById(authorId) {
    let author = await Member.findById(authorId).select('username profileImage professionalTitle topics');
    return author ? { name: author.username, image: author.profileImage, professionalTitle: author.professionalTitle, topics: author.topics } : 
           { name: 'Unknown Author', image: null, professionalTitle: 'No title available', topics: [] };
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
            ...taggedArticles.map(unit => ({ unitType: 'article', title: unit.article_title || "Untitled Article", mainTopic: unit.main_topic || "No topic", _id: unit._id })),
            ...taggedVideos.map(unit => ({ unitType: 'video', title: unit.video_title || "Untitled Video", mainTopic: unit.main_topic || "No topic", _id: unit._id })),
            ...taggedPromptSets.map(unit => ({ unitType: 'promptset', title: unit.promptset_title || "Untitled Prompt Set", mainTopic: unit.main_topic || "No topic", _id: unit._id })),
            ...taggedInterviews.map(unit => ({ unitType: 'interview', title: unit.interview_title || "Untitled Interview", mainTopic: unit.main_topic || "No topic", _id: unit._id })),
            ...taggedExercises.map(unit => ({ unitType: 'exercise', title: unit.exercise_title || "Untitled Exercise", mainTopic: unit.main_topic || "No topic", _id: unit._id })),
            ...taggedTemplates.map(unit => ({ unitType: 'template', title: unit.template_title || "Untitled Template", mainTopic: unit.main_topic || "No topic", _id: unit._id }))
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



async function getPromptSchedule(memberId, promptSetId) {
    let targetDate = null;

    const registration = await PromptSetRegistration.findOne({ memberId, promptSetId });

    if (registration) {
        targetDate = registration.targetCompletionDate;
    }

    if (!targetDate) {
        console.warn(`No target date found for member ${memberId} and promptSetId ${promptSetId}`);
        return null;
    }

    // ✅ Calculate remaining prompts and recommended due dates
    const today = new Date();
    targetDate = new Date(targetDate);
    const remainingDays = Math.max(0, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)));
    // ✅ First fetch completed prompt sets
const completedRecords = await PromptSetCompletion.find({ memberId }).populate('promptSetId');



    const progress = await PromptSetProgress.findOne({ memberId, promptSetId });
    const remainingPrompts = progress ? 20 - progress.completedPrompts.length : 20;

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
    renderMemberDashboard: async (req, res) => {

        try {
            const { id } = req.session.user;
            const userData = await Member.findById(id)
            
            .select('username profileImage professionalTitle organization topics accessLevel')
            .lean();
            const memberProfile = await MemberProfile.findOne({ memberId: id }).select('profileImage');


            const accessLevelLabels = {
                free_individual: 'Free',
                contributor_individual: 'Contributing',
                paid_individual: 'Paid'
              };
              
              const accessLevelLabel = accessLevelLabels[userData.accessLevel] || 'Member';

            if (!userData) {
                throw new Error(`Member with ID ${id} not found.`);
            }

            console.log('Member data fetched:', userData);


            let registeredPromptSets = [];
            let promptSchedules = [];

            const memberRegistrations = await PromptSetRegistration.find({ memberId: id }).populate('promptSetId');


            // ✅ Process each registered prompt set
            await Promise.all(
                memberRegistrations.map(async (registration) => {
                    const promptSet = await PromptSet.findById(registration.promptSetId);
                    if (!promptSet) 
                        return;

                    // ✅ Fetch progress
                    const progress = await PromptSetProgress.findOne({ memberId: id, promptSetId: registration.promptSetId });

                    const currentPromptIndex = progress?.currentPromptIndex ?? 0; // ✅ Ensure first prompt is always 0

                    console.log(`Progress for promptSetId ${registration.promptSetId._id}: ${currentPromptIndex}`);

                    const headlineKey = `prompt_headline${currentPromptIndex}`;
                    const promptKey = `Prompt${currentPromptIndex}`;
                    
                    
                    const promptHeadline = promptSet[headlineKey] || "No headline found";
                    const promptText = promptSet[promptKey] || "No prompt text found";

                    const isCompleted = progress?.completedPrompts?.length >= 20;

                    if (!isCompleted) { 
                        registeredPromptSets.push({
                            registrationId: registration._id,
                            promptSetId: registration.promptSetId._id.toString(),
                            promptSetTitle: promptSet.promptset_title,
                            frequency: registration.frequency,
                            mainTopic: promptSet.main_topic,
                            purpose: promptSet.purpose,
                            promptHeadline,  // ✅ Ensure this is always Prompt0
                            promptText,      // ✅ Ensure this is always Prompt0
                            promptIndex: currentPromptIndex ?? 0,  // ✅ Use the dynamic prompt index
                        });
                        
                    }

console.log("🔍 Checking prompt retrieval...");
console.log(`   Available Keys in promptSet:`, Object.keys(promptSet)); 
console.log(`   headlineKey: prompt_headline0`);
console.log(`   promptKey: Prompt0`);
console.log(`   Retrieved Headline:`, promptSet["prompt_headline0"]);
console.log(`   Retrieved Text:`, promptSet["Prompt0"]);
                    

                    // ✅ Get prompt schedule
                    promptSchedules.push(await getPromptSchedule(id, registration.promptSetId));
                })
            );

            // ✅ Fetch completed prompt sets
// ✅ Fetch completed prompt sets
// ✅ First fetch completed prompt sets
const completedRecords = await PromptSetCompletion.find({ memberId: id }).populate('promptSetId');
const completedIds = new Set(completedRecords.map(record => record.promptSetId._id.toString()));

// ✅ Then fetch in-progress prompt records
const progressRecords = await PromptSetProgress.find({ memberId: id }).populate('promptSetId');

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

// ✅ Format completed sets for view
const formattedCompletedSets = completedRecords.map(record => ({
    promptSetTitle: record.promptSetId.promptset_title,
    frequency: record.promptSetId.suggested_frequency,
    mainTopic: record.promptSetId.main_topic,
    completedAt: record.completedAt ? new Date(record.completedAt).toDateString() : "Unknown Date",
    badge: record.earnedBadge
}));



            console.log("Final session before rendering:", req.session);

            // ✅ Fetch tagged and contributed units
            const memberTaggedUnits = await fetchTaggedUnits(id);
            const [memberArticles, memberVideos, memberPromptSets, memberInterviews, memberExercises, memberTemplates] = await Promise.all([
                Article.find({ 'author.id': id }),
                Video.find({ 'author.id': id }),
                PromptSet.find({ 'author.id': id }),
                Interview.find({ 'author.id': id }),
                Exercise.find({ 'author.id': id }),
                Template.find({ 'author.id': id }),
            ]);

            const memberUnits = await Promise.all(
                [...memberArticles, ...memberVideos, ...memberPromptSets, ...memberInterviews, ...memberExercises, ...memberTemplates].map(async (unit) => {
                    const author = await resolveAuthorById(unit.author?.id || unit.author);
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

            // Attach subtopics and slugs for the member's topics
// Attach subtopics and slugs for the member's topics (Fix for missing topics)
const selectedTopics = {
    topic1: userData.topics?.topic1
        ? {
            title: userData.topics.topic1,
            subtopics: getSubtopics(userData.topics.topic1), // ✅ Fetch subtopics from topics.json
            slug: topicMappings[userData.topics.topic1] || "unknown-topic",
            viewName: topicViewMappings[topicMappings[userData.topics.topic1]] || "not_found"
        }
        : null,
    topic2: userData.topics?.topic2
        ? {
            title: userData.topics.topic2,
            subtopics: getSubtopics(userData.topics.topic2), // ✅ Fetch subtopics from topics.json
            slug: topicMappings[userData.topics.topic2] || "unknown-topic",
            viewName: topicViewMappings[topicMappings[userData.topics.topic2]] || "not_found"
        }
        : null,
    topic3: userData.topics?.topic3
        ? {
            title: userData.topics.topic3,
            subtopics: getSubtopics(userData.topics.topic3), // ✅ Fetch subtopics from topics.json
            slug: topicMappings[userData.topics.topic3] || "unknown-topic",
            viewName: topicViewMappings[topicMappings[userData.topics.topic3]] || "not_found"
        }
        : null
};


// ✅ Log topics to debug missing data
console.log("🔍 Selected Topics for Member Dashboard:", selectedTopics);



return res.render("member_dashboard", {
  layout: "dashboardlayout",
  title: "Member Dashboard",
  csrfToken: req.csrfToken(), // ✅ This is required!
  member: {
    ...userData,
    profileImage: memberProfile?.profileImage || '/images/default-avatar.png',
    selectedTopics,
    accessLevel: userData.accessLevel,
    accessLevelLabel
  },
  memberUnits,
  memberTaggedUnits,
  registeredPromptSets,
  promptSet: registeredPromptSets[0] || null,
  memberPromptSchedule: promptSchedules[0] || null,
  promptSchedules,
  currentPromptSets,
  completedPromptSets: formattedCompletedSets
});





        } catch (err) {
            console.error('Error rendering member dashboard:', err);
            return res.status(500).render('member_form_views/error', {
                layout: 'mainlayout',
                title: 'Error',
                errorMessage: 'An unexpected error occurred. Please try again later.',
            });
        }
    }
};




