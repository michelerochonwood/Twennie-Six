const fs = require('fs');
const path = require('path');
const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const Interview = require('../models/unit_models/interview');
const Promptset = require('../models/unit_models/promptset');
const Exercise = require('../models/unit_models/exercise');
const Template = require('../models/unit_models/template');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const Member = require('../models/member_models/member');
const TopicSuggestion = require('../models/topic/topic_suggestion'); // Adjust the path as needed
const MemberProfile = require('../models/profile_models/member_profile');
const GroupMemberProfile = require('../models/profile_models/groupmember_profile');
const LeaderProfile = require('../models/profile_models/leader_profile');




// Resolves an author's display name and profile image based on their role.
// Leaders, Group Members, and Members are stored in separate models by design.
// Leaders use `groupLeaderName` instead of `name`, so we map it manually here for consistency.
async function resolveAuthorById(authorId) {
    try {
        // Check Leader profile
        let profile = await LeaderProfile.findOne({ leaderId: authorId }).select('profileImage name');
        if (profile) {
            return {
                name: profile.name || 'Leader',
                image: profile.profileImage || '/images/default-avatar.png'
            };
        }

        // Check Group Member profile
        profile = await GroupMemberProfile.findOne({ memberId: authorId }).select('profileImage name');
        if (profile) {
            return {
                name: profile.name || 'Group Member',
                image: profile.profileImage || '/images/default-avatar.png'
            };
        }

        // Check Individual Member profile
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


exports.getTopicView = async (req, res) => {

    const normalizedTopic = req.params.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const topicsFilePath = path.join(__dirname, '../public/data/topics.json');

    try {
        if (!fs.existsSync(topicsFilePath)) {
            console.error('Topics file is missing.');
            return res.status(404).send('Topics file is missing.');
        }

        const topicsData = JSON.parse(fs.readFileSync(topicsFilePath, 'utf8'));
        if (!Array.isArray(topicsData.topics)) {
            throw new Error('Invalid topics.json format: "topics" should be an array.');
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

        const originalTopicTitle = Object.keys(topicMappings).find(
            (title) => topicMappings[title] === normalizedTopic
        );

        if (!originalTopicTitle) {
            console.error(`Topic not found for normalized title: ${normalizedTopic}`);
            return res.status(404).send('Topic not found.');
        }

        console.log(`Resolved Topic Title: ${originalTopicTitle}`);

        const topic = topicsData.topics.find((t) => t.title === originalTopicTitle);
        if (!topic) {
            console.error(`Topic data missing for title: ${originalTopicTitle}`);
            return res.status(404).send('Topic data not found.');
        }

        // Search for units where the topic is in main_topic or secondary_topics
        const queryCondition = { 
            $or: [
                { main_topic: topic.title }, 
                { secondary_topics: topic.title }  // Replaced sub_topics with secondary_topics
            ]
        };
        console.log(`Query Condition:`, JSON.stringify(queryCondition, null, 2));

        const [articles, videos, interviews, promptsets, exercises, templates] = await Promise.all([
            Article.find(queryCondition).lean(),
            Video.find(queryCondition).lean(),
            Interview.find(queryCondition).lean(),
            Promptset.find(queryCondition).lean(),
            Exercise.find(queryCondition).lean(),
            Template.find(queryCondition).lean(),
        ]);

        console.log(`Found Articles: ${articles.length}`);
        console.log(`Found Videos: ${videos.length}`);
        console.log(`Found Interviews: ${interviews.length}`);
        console.log(`Found Promptsets: ${promptsets.length}`);
        console.log(`Found Exercises: ${exercises.length}`);
        console.log(`Found Templates: ${templates.length}`);

const allUnits = [
  ...articles.map((unit) => ({ title: unit.article_title, ...unit, type: 'article', authorId: unit.author?.id || unit.author })),
  ...videos.map((unit) => ({ title: unit.video_title, ...unit, type: 'video', authorId: unit.author?.id || unit.author })),
  ...interviews.map((unit) => ({ title: unit.interview_title, ...unit, type: 'interview', authorId: unit.author?.id || unit.author })),
  ...promptsets.map((unit) => ({
    title: unit.promptset_title,
    ...unit,
    type: 'promptset',
    authorId: unit.author?.id || unit.author,
    targetAudience: unit.target_audience,
    characteristics: unit.characteristics,
    purpose: unit.purpose,
    suggestedFrequency: unit.suggested_frequency,
  })),
  ...exercises.map((unit) => ({ title: unit.exercise_title, ...unit, type: 'exercise', authorId: unit.author?.id || unit.author })),
  ...templates.map((unit) => ({ title: unit.template_title, ...unit, type: 'template', authorId: unit.author?.id || unit.author })),
];

        console.log(`Total Processed Units: ${allUnits.length}`);

const libraryUnits = await Promise.all(
  allUnits.map(async (unit) => {
    const authorId = unit.author?.id || unit.author;
const author = authorId
    ? await resolveAuthorById(authorId)
    : { name: 'Unknown Author', image: '/images/default-avatar.png' };

    return {
      ...unit,
      authorName: author.name,
      authorImage: author.image || '/images/default-avatar.png',
    };
  })
);

const userId = req.session.user?.id;
const userType = req.session.user?.membershipType;

const myLibraryUnits = libraryUnits.filter(unit => String(unit.authorId) === String(userId));


const groupLibraryUnits = libraryUnits.filter(unit => unit.visibility === 'team_only');

const orgLibraryUnits = libraryUnits.filter(unit => unit.visibility === 'organization_only');

const twennieLibraryUnits = libraryUnits.filter(unit => unit.visibility === 'all_members');

const sectionedUnits = [
  {
    sectionTitle: "my library units",
    units: myLibraryUnits,
    emptyMessage: "If you'd like to contribute new units to the library, go to your dashboard under the \"contribute to the library\" tab. You can add an article, a video, an interview, a new prompt set, an exercise, or a template."
  },
  {
    sectionTitle: "my group's library units",
    units: groupLibraryUnits,
    emptyMessage: "If you'd like to see your group contributing units to the library, give them some encouragement. A wide variety of Twennie topics allows them to share knowledge, from mental health, emotional intelligence, and team building, to ai, project management, and business development. Teaching others is one of the most powerful ways to learn and engage with team members."
  },
  {
    sectionTitle: "my organization's library units",
    units: orgLibraryUnits,
    emptyMessage: "If you'd like to see your organization contributing units to the library, organize some friendly competition. Hold a prompt set writing contest in which teams compete to produce a prompt set for the whole organization. Have a team of judges decide the top prompts, such as the most insightful, the funniest, or most challenging. Friendly competition engages learners."
  },
  {
    sectionTitle: "Twennie's library units",
    units: twennieLibraryUnits
  }
];




const user = req.user; 

res.render('bytopic_views/bytopic_view', {
  layout: 'bytopiclayout',
  title: topic.title,
  shortSummary: topic.shortSummary,
  longSummary: topic.longSummary,
  sectionedUnits,
  loggedIn: !!user,
  accessLevel: user?.accessLevel || null,
  membershipType: user?.membershipType || null
});

    } catch (error) {
        console.error('Error loading topic or units:', error);
        return res.status(500).send('An internal error occurred.');
    }
};

exports.showTopicSuggestionForm = async (req, res) => {
    const { user } = req.session;

    try {
        let memberData;
        let memberType;

        if (!user) {
            return res.status(401).send('You must be logged in to suggest a topic.');
        }

        if (await Leader.findById(user.id)) {
            memberData = await Leader.findById(user.id).select('groupLeaderName email groupName');
            memberType = 'Leader';
        } else if (await GroupMember.findById(user.id)) {
            memberData = await GroupMember.findById(user.id).select('name email groupName');
            memberType = 'GroupMember';
        } else {
            memberData = await Member.findById(user.id).select('name email');
            memberType = 'Member';
        }

        res.render('bytopic_views/suggest_topic_form', {
            layout: 'mainlayout',
            csrfToken: req.csrfToken(),
            user: {
                name: memberData.groupLeaderName || memberData.name,
                email: memberData.email,
                groupName: memberData.groupName || null,
                memberType,
                memberId: user.id
            }
        });
    } catch (error) {
        console.error('Error loading suggest topic form:', error);
        res.status(500).send('Could not load form.');
    }
};

exports.submitTopicSuggestion = async (req, res) => {
    const { name, email, groupName, topicTitle, paragraph1, paragraph2, paragraph3 } = req.body;
    const { user } = req.session;

    if (!user) {
        return res.status(401).send('You must be logged in to submit a topic.');
    }

    try {
        let memberType = 'Member';
        if (await Leader.findById(user.id)) memberType = 'Leader';
        else if (await GroupMember.findById(user.id)) memberType = 'GroupMember';

        const suggestion = new TopicSuggestion({
            suggestedBy: user.id,
            memberType,
            name,
            email,
            groupName,
            topicTitle,
            paragraph1,
            paragraph2,
            paragraph3
        });

        await suggestion.save();

        res.render('bytopic_views/topic_suggestion_success', {
            layout: 'mainlayout',
            title: 'Thank you!',
            message: 'Your topic suggestion has been submitted successfully.'
        });
    } catch (error) {
        console.error('Error submitting topic suggestion:', error);
        res.status(500).send('There was an error submitting your suggestion.');
    }
};






















