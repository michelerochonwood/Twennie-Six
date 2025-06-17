const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const Interview = require('../models/unit_models/interview'); // Import Interview model
const PromptSet = require('../models/unit_models/promptset');
const Template = require('../models/unit_models/template');
const Exercise = require('../models/unit_models/exercise');

const Leader = require('../models/member_models/leader'); // Import Leader model
const GroupMember = require('../models/member_models/group_member'); // Import Group Member model
const Member = require('../models/member_models/member');
const mongoose = require('mongoose');
const LeaderProfile = require('../models/profile_models/leader_profile');
const GroupMemberProfile = require('../models/profile_models/groupmember_profile');
const MemberProfile = require('../models/profile_models/member_profile');


async function resolveAuthorById(authorId) {
  // 1. Check leader profile
  let profile = await LeaderProfile.findOne({ leaderId: authorId }).select('profileImage name organization');
  if (profile) {
    const leader = await Leader.findById(authorId).select('groupName');
    return {
      name: profile.name || 'Leader',
      image: profile.profileImage || '/images/default-avatar.png',
      organization: profile.organization || null,
      groupId: leader?._id || null // treat the leader's own ID as their groupId
    };
  }

  // 2. Check group member profile
  profile = await GroupMemberProfile.findOne({ memberId: authorId }).select('profileImage name');
  if (profile) {
    const member = await GroupMember.findById(authorId).select('groupId organization');
    return {
      name: profile.name || 'Group Member',
      image: profile.profileImage || '/images/default-avatar.png',
      groupId: member?.groupId || null,
      organization: member?.organization || null
    };
  }

  // 3. Check individual member profile
  profile = await MemberProfile.findOne({ memberId: authorId }).select('profileImage name');
  if (profile) {
    const member = await Member.findById(authorId).select('organization');
    return {
      name: profile.name || 'Member',
      image: profile.profileImage || '/images/default-avatar.png',
      organization: member?.organization || null,
      groupId: null
    };
  }

  // 4. Fallback
  return {
    name: 'Unknown Author',
    image: '/images/default-avatar.png',
    organization: null,
    groupId: null
  };
}







module.exports = {
    
viewArticle: async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Fetching article with ID: ${id}`);

    // 1. Fetch the article
    const article = await Article.findById(id);
    if (!article) {
      console.warn(`❌ Article with ID ${id} not found.`);
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Article Not Found',
        errorMessage: `The article with ID ${id} does not exist.`,
      });
    }

    console.log("✅ Article found:", article);

    // 2. Resolve author
    const authorId = article.author?.id || article.author;
    const author = await resolveAuthorById(authorId);
    if (!author) {
      console.error(`❌ Author with ID ${authorId} not found.`);
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Author Not Found',
        errorMessage: `The author associated with this article could not be found.`,
      });
    }

    // 3. Check if the current user is the owner
    const isOwner = req.user && req.user.id.toString() === authorId.toString();
    console.log(`👑 Is owner: ${isOwner}`);

    // 4. Determine access based on visibility
    let isAuthorizedToViewFullContent = false;
    let isOrgMatch = false;
    let isTeamMatch = false;

    if (article.visibility === 'all_members') {
      isAuthorizedToViewFullContent = true;
    } else {
      isOrgMatch =
        article.visibility === 'organization_only' &&
        req.user?.organization &&
        author.organization &&
        req.user.organization === author.organization;

      isTeamMatch =
        article.visibility === 'team_only' &&
        req.user?.groupId &&
        author.groupId &&
        req.user.groupId.toString() === author.groupId.toString();

      isAuthorizedToViewFullContent = isOwner || isOrgMatch || isTeamMatch;
    }

    console.log("🔒 Access breakdown:");
    console.log("• Org match:", isOrgMatch);
    console.log("• Team match:", isTeamMatch);
    console.log("🔓 Authorized to view full content:", isAuthorizedToViewFullContent);

    // 5. If the user is a leader, get their group members
    let groupMembers = [];
    if (req.user?.membershipType === 'leader') {
      const leader = await Leader.findById(req.user.id);
      if (leader) {
        groupMembers = await GroupMember.find({ leader: leader._id }).select('name _id');
      }
    }

    // 6. Render the article view
    return res.render('unit_views/single_article', {
      layout: 'unitviewlayout',
      _id: article._id.toString(),
      article_title: article.article_title,
      short_summary: article.short_summary,
      full_summary: article.full_summary,
      article_content: article.article_content,
      article_image: '/images/default-article.png',
      author: {
        name: author.name || 'Unknown Author',
        image: author.image || '/images/default-avatar.png',
      },
      main_topic: article.main_topic,
      secondary_topics: article.secondary_topics,
      sub_topic: article.sub_topic,
      isOwner,
      isAuthorizedToViewFullContent,
      isAuthenticated: !!req.user,
      isGroupMemberOrLeader:
        req.user?.membershipType === 'leader' || req.user?.membershipType === 'group_member',
      groupMembers, // for tag assignment if user is a leader
      csrfToken: req.csrfToken(),
    });

  } catch (err) {
    console.error('💥 Error fetching article:', err.stack || err.message);
    return res.status(500).render('unit_views/error', {
      layout: 'unitviewlayout',
      title: 'Error',
      errorMessage: 'An error occurred while fetching the article.',
    });
  }
},


      
    
    

viewVideo: async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🎥 Fetching video with ID: ${id}`);

    // 1. Fetch the video
    const video = await Video.findById(id);
    if (!video) {
      console.warn(`❌ Video with ID ${id} not found.`);
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Video Not Found',
        errorMessage: `The video with ID ${id} does not exist.`,
      });
    }

    console.log("✅ Video found:", video);

    // 2. Resolve the author
    const authorId = video.author.id || video.author;
    const author = await resolveAuthorById(authorId);
    if (!author) {
      console.error(`❌ Author with ID ${authorId} not found.`);
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Author Not Found',
        errorMessage: `The author associated with this video could not be found.`,
      });
    }

    // 3. Check if current user is the owner
    const isOwner = req.user && req.user.id.toString() === authorId.toString();
    console.log(`👑 Is owner: ${isOwner}`);

    // 4. Determine access based on visibility
    let isAuthorizedToViewFullContent = false;

    if (video.visibility === 'all_members') {
      isAuthorizedToViewFullContent = true;
    } else {
      const isOrgMatch =
        video.visibility === 'organization_only' &&
        req.user.organization &&
        author.organization &&
        req.user.organization === author.organization;

      const isTeamMatch =
        video.visibility === 'team_only' &&
        req.user.groupId &&
        author.groupId &&
        req.user.groupId.toString() === author.groupId.toString();

      isAuthorizedToViewFullContent = isOwner || isOrgMatch || isTeamMatch;

      console.log("🔒 Access breakdown:");
      console.log("• isOrgMatch:", isOrgMatch);
      console.log("• isTeamMatch:", isTeamMatch);
    }

    console.log("📌 Visibility:", video.visibility);
    console.log("🔓 Authorized to view full content:", isAuthorizedToViewFullContent);

    // 5. Render the view
res.render('unit_views/single_video', {
  layout: 'unitviewlayout',
  _id: video._id.toString(),
  video_title: video.video_title,
  short_summary: video.short_summary,
  full_summary: video.full_summary,
  video_content: video.video_content || '', // for iframe embedding
  video_url: video.video_url || '/images/valuegroupcont.png', // fallback preview image
  author: {
    name: author.name || 'Unknown Author',
    image: author.image || '/images/default-avatar.png',
  },
  main_topic: video.main_topic,
  secondary_topics: video.secondary_topics,
  sub_topic: video.sub_topic,
  isOwner,
  isAuthorizedToViewFullContent,
  isAuthenticated: req.isAuthenticated() // ✅ ensures toggle works
});


  } catch (err) {
    console.error('💥 Error fetching video:', err.stack || err.message);
    res.status(500).render('unit_views/error', {
      layout: 'unitviewlayout',
      title: 'Error',
      errorMessage: 'An error occurred while fetching the video.',
    });
  }
},

      
    
    
    
viewInterview: async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🎙️ Fetching interview with ID: ${id}`);

    // 1. Fetch the interview
    const interview = await Interview.findById(id);
    if (!interview) {
      console.warn(`❌ Interview with ID ${id} not found.`);
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Interview Not Found',
        errorMessage: `The interview with ID ${id} does not exist.`,
      });
    }

    console.log("✅ Interview found:", interview);

    // 2. Resolve the author
    const authorId = interview.author.id || interview.author;
    const author = await resolveAuthorById(authorId);
    if (!author) {
      console.error(`❌ Author with ID ${authorId} not found.`);
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Author Not Found',
        errorMessage: `The author associated with this interview could not be found.`,
      });
    }

    // 3. Check if the current user is the owner
    const isOwner = req.user && req.user.id.toString() === authorId.toString();
    console.log(`👑 Is owner: ${isOwner}`);

    // 4. Determine access based on visibility
    let isAuthorizedToViewFullContent = false;
    let isOrgMatch = false;
    let isTeamMatch = false;

    if (interview.visibility === 'all_members') {
      isAuthorizedToViewFullContent = true;
    } else {
      isOrgMatch =
        interview.visibility === 'organization_only' &&
        req.user?.organization &&
        author.organization &&
        req.user.organization === author.organization;

      isTeamMatch =
        interview.visibility === 'team_only' &&
        req.user?.groupId &&
        author.groupId &&
        req.user.groupId.toString() === author.groupId.toString();

      isAuthorizedToViewFullContent = isOwner || isOrgMatch || isTeamMatch;
    }

    console.log("🔒 Access breakdown:");
    console.log("• Org match:", isOrgMatch);
    console.log("• Team match:", isTeamMatch);
    console.log("🔓 Authorized to view full content:", isAuthorizedToViewFullContent);

    // 5. Render the view
    res.render('unit_views/single_interview', {
      layout: 'unitviewlayout',
      _id: interview._id.toString(),
      interview_title: interview.interview_title,
      short_summary: interview.short_summary,
      full_summary: interview.full_summary,
      interview_link: interview.video_link || '',
      interview_content: interview.transcript || "Transcript will be available soon.",
      author: {
        name: author.name || 'Unknown Author',
        image: author.image || '/images/default-avatar.png',
      },
      main_topic: interview.main_topic,
      secondary_topics: interview.secondary_topics,
      sub_topic: interview.sub_topic,
      isOwner,
      isAuthorizedToViewFullContent,
      isAuthenticated: req.isAuthenticated()
    });

  } catch (err) {
    console.error('💥 Error fetching interview:', err.stack || err.message);
    res.status(500).render('unit_views/error', {
      layout: 'unitviewlayout',
      title: 'Error',
      errorMessage: 'An error occurred while fetching the interview.',
    });
  }
},



      
    
    

viewPromptset: async (req, res) => {

  try {
    const { id } = req.params;
    console.log(`Fetching prompt set with ID: ${id}`);

    const promptSet = await PromptSet.findById(id);
    if (!promptSet) {
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Prompt Set Not Found',
        errorMessage: `The prompt set with ID ${id} does not exist.`,
      });
    }

    console.log('Prompt set found:', promptSet);

    const authorId = promptSet.author.id || promptSet.author;
    const author = await resolveAuthorById(authorId);

    if (!author) {
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Author Not Found',
        errorMessage: `The author associated with this prompt set could not be found.`,
      });
    }

    const isOwner = req.user && req.user.id.toString() === authorId.toString();
    console.log(`Is owner: ${isOwner}`);

    const isLeader = req.user && req.user.membershipType === 'leader';
    console.log(`Is leader: ${isLeader}`);

    let groupMembers = [];
    if (isLeader) {
      console.log(`Fetching group members for leader ID: ${req.user.id}`);
      groupMembers = await GroupMember.find({ groupId: new mongoose.Types.ObjectId(req.user.id) }).select('name _id');
      console.log('Group Members:', groupMembers);
    }

    const isGroupMember = await GroupMember.findById(req.user?._id);
    const isPaidIndividual = req.user?.membershipType === 'member' && ['paid_individual', 'contributor_individual'].includes(req.user.accessLevel);

    // ✅ VISIBILITY CHECK INSERTED HERE
    let isAuthorizedToViewFullContent = false;

    if (promptSet.visibility === 'all_members') {
      isAuthorizedToViewFullContent = true;
    } else {
      const isOrgMatch =
        promptSet.visibility === 'organization_only' &&
        req.user.organization &&
        author.organization &&
        req.user.organization === author.organization;

      const isTeamMatch =
        promptSet.visibility === 'team_only' &&
        req.user.groupId &&
        author.groupId &&
        req.user.groupId.toString() === author.groupId.toString();

      isAuthorizedToViewFullContent = isOwner || isLeader || isGroupMember || isPaidIndividual || isOrgMatch || isTeamMatch;
    }

    res.render('unit_views/single_promptset', {
      layout: 'unitviewlayout',
        csrfToken: req.csrfToken(), 
      _id: promptSet._id.toString(),
      promptset_title: promptSet.promptset_title,
      short_summary: promptSet.short_summary,
      full_summary: promptSet.full_summary,
      main_topic: promptSet.main_topic,
      secondary_topics: promptSet.secondary_topics,
      sub_topic: promptSet.sub_topic,
      target_audience: promptSet.target_audience,
      characteristics: promptSet.characteristics,
      purpose: promptSet.purpose,
      suggested_frequency: promptSet.suggested_frequency,

      prompts: [
        promptSet.Prompt1, promptSet.Prompt2, promptSet.Prompt3, promptSet.Prompt4, promptSet.Prompt5,
        promptSet.Prompt6, promptSet.Prompt7, promptSet.Prompt8, promptSet.Prompt9, promptSet.Prompt10,
        promptSet.Prompt11, promptSet.Prompt12, promptSet.Prompt13, promptSet.Prompt14, promptSet.Prompt15,
        promptSet.Prompt16, promptSet.Prompt17, promptSet.Prompt18, promptSet.Prompt19, promptSet.Prompt20,
      ],

      prompt_headlines: [
        promptSet.prompt_headline1, promptSet.prompt_headline2, promptSet.prompt_headline3, promptSet.prompt_headline4, promptSet.prompt_headline5,
        promptSet.prompt_headline6, promptSet.prompt_headline7, promptSet.prompt_headline8, promptSet.prompt_headline9, promptSet.prompt_headline10,
        promptSet.prompt_headline11, promptSet.prompt_headline12, promptSet.prompt_headline13, promptSet.prompt_headline14, promptSet.prompt_headline15,
        promptSet.prompt_headline16, promptSet.prompt_headline17, promptSet.prompt_headline18, promptSet.prompt_headline19, promptSet.prompt_headline20,
      ],

      prompt0: promptSet.Prompt0,
      prompt_headline0: promptSet.prompt_headline0,

      options: {
        clarify_topic: promptSet.clarify_topic,
        topics_and_enlightenment: promptSet.topics_and_enlightenment,
        challenge: promptSet.challenge,
        instructions: promptSet.instructions,
        time: promptSet.time,
        permission: promptSet.permission,
      },
      author: {
        name: author.name || 'Unknown Author',
        image: author.image || '/images/default-avatar.png',
      },
  isOwner,
  isLeader,
  isAuthenticated: req.isAuthenticated(), // ✅ Add this line
  isAuthorizedToViewFullContent,
  groupMembers
});

  } catch (err) {
    console.error('Error fetching prompt set:', err.stack || err.message);
    res.status(500).render('unit_views/error', {
      layout: 'unitviewlayout',
      title: 'Error',
      errorMessage: 'An error occurred while fetching the prompt set.',
    });
  }
},

    
    
    

    
viewExercise: async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📘 Fetching exercise with ID: ${id}`);

    // 1. Fetch the exercise
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Exercise Not Found',
        errorMessage: `The exercise with ID ${id} does not exist.`,
      });
    }

    console.log("✅ Fetched Exercise:", exercise);

    // 2. Get the author's ID
    const authorId = exercise.author.id || exercise.author;
    if (!authorId) {
      return res.status(500).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Error',
        errorMessage: 'An error occurred while fetching the exercise author.',
      });
    }

    // 3. Resolve author profile (image, name, org, group)
    const creator = await resolveAuthorById(authorId);
    console.log("👤 Resolved creator:", creator);

    // 4. Is the current user the creator?
    const isOwner = req.user && req.user._id.toString() === authorId.toString();
    console.log(`👑 Is owner: ${isOwner}`);

    // 5. Determine access based on visibility
    let isAuthorizedToViewFullContent = false;
    let isOrgMatch = false;
    let isTeamMatch = false;

    if (exercise.visibility === 'all_members') {
      isAuthorizedToViewFullContent = true;
    } else {
      isOrgMatch =
        exercise.visibility === 'organization_only' &&
        req.user?.organization &&
        creator.organization &&
        req.user.organization === creator.organization;

      isTeamMatch =
        exercise.visibility === 'team_only' &&
        req.user?.groupId &&
        creator.groupId &&
        req.user.groupId.toString() === creator.groupId.toString();

      isAuthorizedToViewFullContent = isOwner || isOrgMatch || isTeamMatch;
    }

    console.log("🔒 Access breakdown:");
    console.log("• Org match:", isOrgMatch);
    console.log("• Team match:", isTeamMatch);
    console.log("🔓 Authorized to view full content:", isAuthorizedToViewFullContent);

    // 6. Render the view
    res.render('unit_views/single_exercise', {
      layout: 'unitviewlayout',
      _id: exercise._id.toString(),
      exercise_title: exercise.exercise_title,
      short_summary: exercise.short_summary,
      full_summary: exercise.full_summary,
      time_required: exercise.time_required,
      file_format: exercise.file_format,
      document_uploads: Array.isArray(exercise.document_uploads)
        ? exercise.document_uploads
        : [exercise.document_uploads],
      creator: {
        name: creator.name || 'Unknown Creator',
        image: creator.image || '/images/default-avatar.png',
      },
      main_topic: exercise.main_topic,
      secondary_topics: exercise.secondary_topics,
      sub_topic: exercise.sub_topic,
      isOwner,
      isAuthorizedToViewFullContent,
      isGroupMemberOrLeader:
        req.user?.membershipType === 'leader' || req.user?.membershipType === 'group_member',
      csrfToken: req.csrfToken()
    });

  } catch (err) {
    console.error('💥 Error fetching exercise:', err.stack || err.message);
    res.status(500).render('unit_views/error', {
      layout: 'unitviewlayout',
      title: 'Error',
      errorMessage: 'An error occurred while fetching the exercise.',
    });
  }
},


    
    
    
    
    
viewTemplate: async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Fetching template with ID: ${id}`);

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Template Not Found',
        errorMessage: `The template with ID ${id} does not exist.`,
      });
    }

    const authorId = template.author.id || template.author;
    const author = await resolveAuthorById(authorId);
    if (!author) {
      return res.status(404).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Author Not Found',
        errorMessage: `The author associated with this template could not be found.`,
      });
    }

    const isOwner = req.user && req.user._id.toString() === authorId.toString();

    // ✅ Standard visibility access check
    let isAuthorizedToViewFullContent = false;
    let isOrgMatch = false;
    let isTeamMatch = false;

    if (template.visibility === 'all_members') {
      isAuthorizedToViewFullContent = true;
    } else {
      isOrgMatch =
        template.visibility === 'organization_only' &&
        req.user?.organization &&
        author.organization &&
        req.user.organization === author.organization;

      isTeamMatch =
        template.visibility === 'team_only' &&
        req.user?.groupId &&
        author.groupId &&
        req.user.groupId.toString() === author.groupId.toString();

      isAuthorizedToViewFullContent = isOwner || isOrgMatch || isTeamMatch;
    }

    console.log("🔒 Access breakdown:");
    console.log("• Org match:", isOrgMatch);
    console.log("• Team match:", isTeamMatch);
    console.log("🔓 Authorized to view full content:", isAuthorizedToViewFullContent);

    res.render('unit_views/single_template', {
      layout: 'unitviewlayout',
      _id: template._id.toString(),
      template_title: template.template_title,
      short_summary: template.short_summary,
      full_summary: template.full_summary,
      template_content: template.template_content,
      documentUploads: template.documentUploads,
      author: {
        name: author.name || 'Unknown Author',
        image: author.image || '/images/default-avatar.png',
      },
      main_topic: template.main_topic,
      secondary_topics: template.secondary_topics,
      sub_topic: template.sub_topic,
      isOwner,
      isAuthorizedToViewFullContent,
      isGroupMemberOrLeader:
        req.user?.membershipType === 'leader' || req.user?.membershipType === 'group_member',
      csrfToken: req.csrfToken()
    });

  } catch (err) {
    console.error('💥 Error fetching template:', err.stack || err.message);
    res.status(500).render('unit_views/error', {
      layout: 'unitviewlayout',
      title: 'Error',
      errorMessage: 'An error occurred while fetching the template.',
    });
  }
}


};    