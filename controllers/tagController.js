const Tag = require('../models/tag');
const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');





exports.createTag = async (req, res) => {
  try {
    const { name, itemId, itemType, assignedTo, instructions } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'User must be logged in to create tags.' });
    }

    const userId = req.user.id;
    let userModel;

    const isMember = await Member.exists({ _id: userId });
    const isLeader = await Leader.exists({ _id: userId });
    const isGroupMember = await GroupMember.exists({ _id: userId });

    if (isMember) {
      userModel = 'member';
    } else if (isLeader) {
      userModel = 'leader';
    } else if (isGroupMember) {
      userModel = 'group_member';
    } else {
      return res.status(403).json({ message: 'Invalid user. Unable to create a tag.' });
    }

    if (!name || !itemId || !itemType) {
      return res.status(400).json({ message: 'Tag name, item ID, and item type are required.' });
    }

    // Check if tag already exists
    let tag = await Tag.findOne({ name });

    if (!tag) {
      tag = new Tag({
        name,
        createdBy: userId,
        createdByModel: userModel,
        associatedUnits: itemType !== 'topic' ? [itemId] : [],
        associatedTopics: itemType === 'topic' ? [itemId] : [],
        unitType: itemType !== 'topic' ? itemType : undefined,
      });
    } else {
      const isAlreadyTagged = itemType === 'topic'
        ? tag.associatedTopics.includes(itemId)
        : tag.associatedUnits.includes(itemId);

      if (isAlreadyTagged) {
        return res.status(400).json({ message: 'You have already tagged this item.' });
      }

      if (itemType === 'topic') {
        tag.associatedTopics.push(itemId);
      } else {
        tag.associatedUnits.push(itemId);
        tag.unitType = itemType;
      }
    }

    // ✅ Only leaders can assign tags to group members
    if (isLeader && assignedTo?.length > 0) {
      tag.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      tag.instructions = instructions || '';
    }

    await tag.save();
    res.status(200).json({ message: 'Tag added successfully.', tag });

  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getTagsForItem = async (req, res) => {
    try {
        const { itemId, itemType } = req.params;
        let tags = itemType === 'topic' 
            ? await Tag.find({ associatedTopics: itemId })
            : await Tag.find({ associatedUnits: itemId, unitType: itemType });
        res.status(200).json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getTagsForUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User must be logged in to view their tags.' });
        }
        const userId = req.user.id;
        let tags = await Tag.find({ createdBy: userId }).lean();
        res.status(200).json(tags);
    } catch (error) {
        console.error('Error fetching user tags:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.removeTag = async (req, res) => {
  try {
    const { tagId, itemId, itemType } = req.params;
    const assignedUserId = req.query.assignedTo; // Optional: remove just one assigned user

    if (!req.user) {
      return res.status(401).json({ message: 'User must be logged in to remove tags.' });
    }

    const userId = req.user.id;
    const tag = await Tag.findById(tagId);

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found.' });
    }

    // ✅ Only the creator of the tag can remove or unassign it
    if (tag.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only remove tags you created.' });
    }

    // ✅ Remove association with a topic or unit
    if (itemType === 'topic') {
      tag.associatedTopics = tag.associatedTopics.filter(id => id.toString() !== itemId);
    } else {
      tag.associatedUnits = tag.associatedUnits.filter(id => id.toString() !== itemId);
    }

    // ✅ Optional: remove a specific user from assignedTo
    if (assignedUserId) {
      tag.assignedTo = tag.assignedTo?.filter(id => id.toString() !== assignedUserId);
    }

    // ✅ Delete tag if now empty
    const isNowEmpty =
      tag.associatedUnits.length === 0 &&
      tag.associatedTopics.length === 0 &&
      (!tag.assignedTo || tag.assignedTo.length === 0);

    if (isNowEmpty) {
      await Tag.findByIdAndDelete(tagId);
      return res.status(200).json({ message: 'Tag deleted because no associations remain.' });
    }

    await tag.save();
    return res.status(200).json({ message: 'Tag updated successfully.', tag });

  } catch (error) {
    console.error('Error removing tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




