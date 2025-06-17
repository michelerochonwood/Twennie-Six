const Note = require('../models/notes/notes');
const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const Interview = require('../models/unit_models/interview');
const Exercise = require('../models/unit_models/exercise');
const GroupMember = require('../models/member_models/group_member');
const Leader = require('../models/member_models/leader');
const Template = require('../models/unit_models/template.js');





// 1️⃣ CREATE NOTE (Submission Form Handler)
exports.createNote = async (req, res) => {

    try {
        const { unitId, note_content } = req.body;
        const userId = req.user._id;

        // Ensure only group members or leaders can submit
        const isGroupMember = await GroupMember.findById(userId);
        const isLeader = await Leader.findById(userId);

        if (!isGroupMember && !isLeader) {
            return res.status(403).send("Unauthorized: Only group members and leaders can submit notes.");
        }

        // Determine the correct memberType based on user role
        const memberType = isGroupMember ? 'group_member' : 'leader';

        // Find the unit (article, video, interview, exercise, or template)
        let unit = await Article.findById(unitId) ||
                   await Video.findById(unitId) ||
                   await Interview.findById(unitId) ||
                   await Exercise.findById(unitId) ||
                   await Template.findById(unitId);

        if (!unit) {
            return res.status(404).send("Unit not found.");
        }

        // Create and save the note
        const newNote = new Note({
            unitID: unitId,
            memberID: userId,
            memberType: memberType,
            main_topic: unit.main_topic,
            secondary_topic: unit.secondary_topic || null,
            note_content
        });

        await newNote.save();

        // ✅ Pass the correct dashboard link to the success page
        const dashboardLink = isGroupMember ? "/dashboard/groupmember" : "/dashboard/leader";

        res.render('unit_views/unitnotessuccess', { 
            layout: 'unitviewlayout', 
            dashboard: dashboardLink // Ensure dashboard variable is available
        });

    } catch (error) {
        console.error("Error submitting note:", error);
        res.status(500).send("Error saving note.");
    }
};




// 2️⃣ GET NOTES FOR LEADERS (Group Member Notes)
exports.getNotesByLeader = async (req, res) => {

    try {
        const leaderId = req.user._id;

        // Ensure the requester is a leader
        const leader = await Leader.findById(leaderId);
        if (!leader) {
            return res.status(403).send("Unauthorized: Only leaders can view notes.");
        }

        // Get all group members under this leader
        const groupMembers = await GroupMember.find({ leader: leaderId }).select('_id');
        const groupMemberIds = groupMembers.map(member => member._id);

        // Fetch notes submitted by these group members
        const notes = await Note.find({ memberID: { $in: groupMemberIds } })
            .populate('unitID', 'article_title video_title interview_title exercise_title')
            .sort({ createdAt: -1 });

        res.render('leader_notes_view', { layout: 'leaderlayout', notes });
    } catch (error) {
        console.error("Error fetching notes for leader:", error);
        res.status(500).send("Error retrieving notes.");
    }
};

// 3️⃣ GET NOTES FOR GROUP MEMBERS (Their Own Notes)
exports.getNotesByGroupMember = async (req, res) => {

    try {
        const memberId = req.user._id;

        // Ensure the requester is a group member
        const groupMember = await GroupMember.findById(memberId);
        if (!groupMember) {
            return res.status(403).send("Unauthorized: Only group members can view their notes.");
        }

        // Fetch all notes submitted by this group member
        const notes = await Note.find({ memberID: memberId })
            .populate('unitID', 'article_title video_title interview_title exercise_title')
            .sort({ createdAt: -1 });

        res.render('group_member_notes_view', { layout: 'memberlayout', notes });
    } catch (error) {
        console.error("Error fetching notes for group member:", error);
        res.status(500).send("Error retrieving notes.");
    }
};

