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
const PromptSetCompletion = require('../models/prompt_models/promptsetcompletion');
const fs = require('fs');
const path = require('path');
const MemberProfile = require('../models/profile_models/member_profile');
const GroupMemberProfile = require('../models/profile_models/groupmember_profile');
const LeaderProfile = require('../models/profile_models/leader_profile');







//resolveAuthorById is necessary for showing library units in the library unit table. We have no author property in the unit models, so the resolve function allows the library units to show the author. Don't delete any code in the library units meant to resolve the author by id.

async function resolveAuthorById(authorId) {
    try {
        // Leader profile
        let profile = await LeaderProfile.findOne({ leaderId: authorId }).select('profileImage name');
        if (profile) {
            return {
                name: profile.name || 'Leader',
                image: profile.profileImage || '/images/default-avatar.png'
            };
        }

        // Group Member profile
        profile = await GroupMemberProfile.findOne({ memberId: authorId }).select('profileImage name');
        if (profile) {
            return {
                name: profile.name || 'Group Member',
                image: profile.profileImage || '/images/default-avatar.png'
            };
        }

        // Individual Member profile
        profile = await MemberProfile.findOne({ memberId: authorId }).select('profileImage name');
        if (profile) {
            return {
                name: profile.name || 'Member',
                image: profile.profileImage || '/images/default-avatar.png'
            };
        }
    } catch (error) {
        console.error('Error resolving author profile:', error);
    }

    return {
        name: 'Unknown Author',
        image: '/images/default-avatar.png'
    };
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

//we have used lean here and it doesn't appear to have caused problems, but lean caused problems elsewhere, so don't use it
async function fetchTaggedUnits(userId) {
    try {
        const tags = await Tag.find({ assignedTo: userId }).lean(); // 🔍 Filter based on assignedTo
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



//everything in this function, getPromptSchedule, is necessary - rewrite it exactly as it is without deleting anything

async function getPromptSchedule(memberId, promptSetId) {
    let targetDate = null;

    const registration = await PromptSetRegistration.findOne({ memberId, promptSetId });
    if (registration) {
        targetDate = registration.targetCompletionDate;
    } else {
        const assignment = await AssignPromptSet.findOne({ assignedMemberId: memberId, promptSetId });
        if (assignment) {
            targetDate = assignment.targetCompletionDate;
        }
    }

    if (!targetDate) {
        console.warn(`No target date found for member ${memberId} and promptSetId ${promptSetId}`);
        return null;
    }

    // Calculate remaining days from today until the target date.
    const today = new Date();
    targetDate = new Date(targetDate);
    const remainingDays = Math.max(0, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)));

    // Use a constant so that it's clear this is the total number of prompts.
    const totalPrompts = 21; // For Prompt0 plus Prompts 1–20

    const progress = await PromptSetProgress.findOne({ memberId, promptSetId });
    const remainingPrompts = progress ? totalPrompts - progress.completedPrompts.length : totalPrompts;

    const spread = remainingPrompts > 0 ? Math.floor(remainingDays / remainingPrompts) : 0;

    return {
        targetCompletionDate: targetDate.toDateString(),
        recommendedCompletionDate: new Date(today.getTime() + spread * 24 * 60 * 60 * 1000).toDateString(),
        remainingDays,
        remainingPrompts,
        spread
    };
}



// Function to get subtopics from topics.json
function getSubtopics(topicTitle) {
    const topicsFilePath = path.join(__dirname, '../public/data/topics.json');
    
    if (!fs.existsSync(topicsFilePath)) {
        console.error('topics.json file is missing.');
        return [];
    }

    const topicsData = JSON.parse(fs.readFileSync(topicsFilePath, 'utf8'));
    const topic = topicsData.topics.find(t => t.title === topicTitle);
    
    return topic ? topic.subtopics : []; // Return an empty array if no subtopics found
}



module.exports = {
    renderGroupMemberDashboard: async (req, res) => {

        try {
            const { id } = req.session.user;
            console.log("Fetching dashboard for user:", id);

            //members of a group are meant to show in the group member dashboard as cards - it is important that none of this changed because the group members are located based on the leader of the group - if you are rewriting anything in this renderdashboard, make sure to rewrite it exactly as you see it here. 
    
            const userData = await GroupMember.findById(id)
            .select('name profileImage professionalTitle organization groupId') // include profileImage explicitly
            .populate({
              path: 'groupId',
              populate: { path: 'members', model: 'GroupMember', select: 'name profileImage professionalTitle' }
            });
        
            console.log("🔍 Fetched user data:", JSON.stringify(userData, null, 2));
            if (!userData) {
                console.error(`Group Member with ID ${id} not found.`);
                return res.status(404).render('error', { title: 'Error', errorMessage: `Group Member with ID ${id} not found.` });
            }

                        // Attach subtopics instead of long summary
                        const selectedTopics = {
                            topic1: {
                                title: userData.groupId.topics.topic1,
                                subtopics: getSubtopics(userData.groupId.topics.topic1),
                                slug: topicMappings[userData.groupId.topics.topic1] || 'unknown-topic',
                                viewName: topicViewMappings[topicMappings[userData.groupId.topics.topic1]] || 'not_found'
                            },
                            topic2: {
                                title: userData.groupId.topics.topic2,
                                subtopics: getSubtopics(userData.groupId.topics.topic2),
                                slug: topicMappings[userData.groupId.topics.topic2] || 'unknown-topic',
                                viewName: topicViewMappings[topicMappings[userData.groupId.topics.topic2]] || 'not_found'
                            },
                            topic3: {
                                title: userData.groupId.topics.topic3,
                                subtopics: getSubtopics(userData.groupId.topics.topic3),
                                slug: topicMappings[userData.groupId.topics.topic3] || 'unknown-topic',
                                viewName: topicViewMappings[topicMappings[userData.groupId.topics.topic3]] || 'not_found'
                            }
                        };
                        console.log("Selected Topics with View Names:", selectedTopics);
                        
    
            console.log("Fetched user data:", userData);
            console.log("Group members before processing:", JSON.stringify(userData.groupId.members, null, 2));
    
            const groupMembers = userData.groupId?.members?.length > 0
                ? userData.groupId.members.map(member => ({
                    name: member.name,
                    profileImage: member.profileImage,
                    professionalTitle: member.professionalTitle
                }))
                : [];
    
                const memberRegistrations = await PromptSetRegistration.find({ memberId: id }).populate('promptSetId');
                const assignedPromptSets = await AssignPromptSet.find({ assignedMemberIds: id }).populate('promptSetId');
                
 
                console.log(`Total assigned prompt sets for member ${id}: ${assignedPromptSets.length}`);
                
            console.log(`Total prompt sets found for member ${id}: ${memberRegistrations.length}`);



    
            let groupmemberPrompts = [];
            let promptSchedules = [];
    
            await Promise.all(
                [...memberRegistrations, ...assignedPromptSets].map(async (registration) => {
                    const promptSet = await PromptSet.findById(registration.promptSetId);
                    if (!promptSet) return;
            
                    // Check if a completion record exists
                    const completion = await PromptSetCompletion.findOne({ memberId: id, promptSetId: registration.promptSetId });
                    if (completion) {
                        completedPromptSets.push({
                            promptSetTitle: promptSet.promptset_title,
                            frequency: registration.frequency,
                            mainTopic: promptSet.main_topic,
                            completedAt: completion.completedAt ? new Date(completion.completedAt).toDateString() : "Unknown Date",
                            badge: promptSet.badge
                        });
                    } else {
                        // Process progress for current prompt sets
                        const progress = await PromptSetProgress.findOne({ memberId: id, promptSetId: registration.promptSetId });
                        const currentPromptIndex = progress?.currentPromptIndex ?? 0;
            
                        console.log(`Progress for promptSetId ${registration.promptSetId._id}: ${currentPromptIndex}`);
            
                        const headlineKey = `prompt_headline${currentPromptIndex}`;
                        const promptKey = `Prompt${currentPromptIndex}`;
                        // ✅ Fetch the leader first, before using it
                        const leader = await Leader.findOne({ _id: userData.groupId._id }).select('groupLeaderName organization');


                        if (!leader) {
                            console.error("❌ ERROR: Leader not found for groupId:", userData.groupId);
                        } else {
                            console.log("✅ Leader Found:", leader.groupLeaderName);
                        }
                        groupmemberPrompts.push({
                            registrationId: registration._id,
                            promptSetId: registration.promptSetId._id.toString(),
                            promptSetTitle: promptSet.promptset_title,
                            frequency: registration.frequency,
                            mainTopic: promptSet.main_topic,
                            purpose: promptSet.purpose,
                            promptHeadline: promptSet[headlineKey] || "No headline found",
                            promptText: promptSet[promptKey] || "No prompt text found",
                            promptIndex: currentPromptIndex,
                            leaderNotes: registration.leaderNotes || null, // Ensure leaderNotes is included,
                            leaderName: leader ? leader.groupLeaderName : "Group Leader"
                        });
            
                        promptSchedules.push(await getPromptSchedule(id, registration.promptSetId));
                    }
                })
            );
            
            
    
            const groupMemberTaggedUnits = await fetchTaggedUnits(id);
    
            const [memberArticles, memberVideos, memberPromptSets, memberInterviews, memberExercises, memberTemplates] = await Promise.all([
                Article.find({ 'author.id': id }),//don't delete any of these - we need author ids for the library table
                Video.find({ 'author.id': id }),
                PromptSet.find({ 'author.id': id }),
                Interview.find({ 'author.id': id }),
                Exercise.find({ 'author.id': id }),
                Template.find({ 'author.id': id })
            ]);
    
const groupMemberUnits = await Promise.all(
  [...memberArticles, ...memberVideos, ...memberPromptSets, ...memberInterviews, ...memberExercises, ...memberTemplates].map(async (unit) => {
    const author = await resolveAuthorById(unit.author?.id || unit.author);
    return {
      unitType: unit.unitType || unit.constructor?.modelName || 'Unknown',
      title: unit.article_title || unit.video_title || unit.promptset_title || unit.interview_title || unit.exercise_title || unit.template_title,
      status: unit.status,
      mainTopic: unit.main_topic,
      _id: unit._id,
      author: author.name,
      authorImage: author.image // ✅ Add this line
    };
  })
);



const registeredPromptSets = req.session.registeredPromptSets || [];

console.log("Registered prompt sets:", registeredPromptSets);

console.log("Progress data is now fully database-driven.");

console.log("Session updates are now minimal and only used for UI display.");

console.log("Progress is now retrieved dynamically from MongoDB.");



// Save the session explicitly - make sure it is saved explicitly so that notes can be posted for the member
req.session.save(err => {
    if (err) {
        console.error("Error saving session:", err);
    } else {
        console.log("SESSION UPDATED SUCCESSFULLY:", JSON.stringify(req.session, null, 2));
    }
});



// Fetch prompt set progress - DO NOT DELETE, this ensures correct progress tracking




const progressRecords = await PromptSetProgress.find({ memberId: id }).populate('promptSetId');

// Only process progress records if they exist
if (progressRecords.length > 0) {
    progressRecords.forEach(record => {
        const progressPercentage = (record.completedPrompts?.length / 21) * 100 || 0; // Ensure valid calculation
        const promptSetData = {
            promptSetTitle: record.promptSetId.promptset_title,
            frequency: record.promptSetId.suggested_frequency,
            progress: `${progressPercentage}%`,
            targetCompletionDate: record.promptSetId.target_completion_date || "Not Set",
            promptIndex: record.currentPromptIndex || 0
        };

        // If fully completed (20/20), move to completed prompt sets
        if (record.completedPrompts?.length >= 21) {
            completedPromptSets.push({
                promptSetTitle: record.promptSetId.promptset_title,
                frequency: record.promptSetId.suggested_frequency,
                mainTopic: record.promptSetId.main_topic,
                completedAt: record.completedAt ? new Date(record.completedAt).toDateString() : "Unknown Date", // ✅ Correctly fetching from PromptSetCompletion
                badge: "placeholder-badge"
            });
        } else {
            currentPromptSets.push(promptSetData);
        }
    });
}

console.log("Group Member Prompts Data:", JSON.stringify(groupmemberPrompts, null, 2));
console.log("All session keys before rendering:", Object.keys(req.session));

const completedRecords = await PromptSetCompletion.find({ memberId: id }).populate('promptSetId');
const completedIds = new Set(completedRecords.map(record => record.promptSetId._id.toString()));

// ✅ Fetch progress records


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

// ✅ Format completed sets for display
const formattedCompletedSets = completedRecords.map(record => ({
  promptSetTitle: record.promptSetId.promptset_title,
  frequency: record.promptSetId.suggested_frequency,
  mainTopic: record.promptSetId.main_topic,
  completedAt: record.completedAt ? new Date(record.completedAt).toDateString() : "Unknown Date",
  badge: record.earnedBadge // ✅ Uses actual badge object with name + image
}));

console.log("Group Data for Leader Lookup:", JSON.stringify(userData.groupId, null, 2));

const leader = await Leader.findOne({ _id: userData.groupId._id }).select('groupLeaderName');

console.log("✅ Final Leader Name Before Rendering:", leader ? leader.groupLeaderName : "Not Found");

const groupMemberProfile = await GroupMemberProfile.findOne({ memberId: id });
// ✅ Final render
return res.render('groupmember_dashboard', {
  layout: 'dashboardlayout',
  title: 'Group Member Dashboard',
  groupMember: {
    ...userData.toObject(),
    profileImage: groupMemberProfile?.profileImage || '/images/default-avatar.png'
  },
  groupMembers,
  maxGroupSize: userData.groupId.groupSize,
  groupMemberUnits,
  groupMemberTaggedUnits,
  registeredPromptSets: groupmemberPrompts,
  promptSchedules,
  currentPromptSets,
  completedPromptSets: formattedCompletedSets,
  selectedTopics,
  leaderName: leader ? leader.groupLeaderName : "Group Leader",
  organization: leader?.organization || 'Unknown'
});

        
        
        
        
        } catch (err) {
            console.error('Error rendering group member dashboard:', err);
            return res.status(500).render('error', { title: 'Error', errorMessage: 'An unexpected error occurred.' });
        }
    }
};
















