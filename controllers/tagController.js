const Tag = require('../models/tag');
const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');

exports.createTag = async (req, res) => {
  try {
    const { name, itemId, itemType } = req.body;
    const assignedToRaw = req.body.assignedTo || {};
    const normalizedAssignedTo = Object.values(assignedToRaw);

    if (!req.user) {
      return res.status(401).json({ message: 'User must be logged in to create tags.' });
    }

    const userId = req.user._id;
    let userModel;

    if (await Member.exists({ _id: userId })) {
      userModel = 'member';
    } else if (await Leader.exists({ _id: userId })) {
      userModel = 'leader';
    } else if (await GroupMember.exists({ _id: userId })) {
      userModel = 'group_member';
    } else {
      return res.status(403).json({ message: 'Invalid user. Unable to create a tag.' });
    }

    if (!name || !itemId || !itemType) {
      return res.status(400).json({ message: 'Tag name, item ID, and item type are required.' });
    }

    let tag = await Tag.findOne({ name });

    if (!tag) {
      tag = new Tag({
        name: name.trim(),
        createdBy: userId,
        createdByModel: userModel,
        associatedUnits: itemType !== 'topic' ? [{ item: itemId, unitType: itemType }] : [],
        associatedTopics: itemType === 'topic' ? [itemId] : [],
        assignedTo: []
      });
    } else {
      const isAlreadyTagged = itemType === 'topic'
        ? tag.associatedTopics.some(id => id.toString() === itemId)
        : tag.associatedUnits.some(u => u.item.toString() === itemId && u.unitType === itemType);

      if (!isAlreadyTagged) {
        if (itemType === 'topic') {
          tag.associatedTopics.push(itemId);
        } else {
          tag.associatedUnits.push({ item: itemId, unitType: itemType });
        }
      }
    }

    // ✅ Handle assignments for leaders (form or AJAX)
    if (userModel === 'leader' && normalizedAssignedTo.length > 0) {
      const newAssignments = [];

      for (const entry of normalizedAssignedTo) {
        if (entry.member) {
          const alreadyAssigned = tag.assignedTo?.some(existing =>
            existing.member.toString() === entry.member
          );
          if (!alreadyAssigned) {
            newAssignments.push({
              member: entry.member,
              instructions: entry.instructions || ''
            });
          }
        }
      }

      tag.assignedTo = [...(tag.assignedTo || []), ...newAssignments];

      await tag.save();

      const isFormRequest = req.headers.accept?.includes('text/html');

      if (isFormRequest) {
        return res.render('unit_views/assign_success', {
          layout: 'unitviewlayout'
        });
      } else {
        return res.status(200).json({ message: 'Assignment saved successfully.', tag });
      }
    }

    // ✅ If not an assignment, just tag normally
    await tag.save();
    return res.status(200).json({ message: 'Tag saved successfully.', tag });

  } catch (error) {
    console.error('❌ Error creating tag:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getTagsForItem = async (req, res) => {
  try {
    const { itemId, itemType } = req.params;

    const tags = itemType === 'topic'
      ? await Tag.find({ associatedTopics: itemId })
      : await Tag.find({ associatedUnits: { $elemMatch: { item: itemId, unitType: itemType } } });

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

    const userId = req.user._id;
    const tags = await Tag.find({ createdBy: userId }).lean();
    res.status(200).json(tags);
  } catch (error) {
    console.error('Error fetching user tags:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.removeTag = async (req, res) => {
  try {
    const { tagId, itemId, itemType } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'User must be logged in to remove tags.' });
    }

    const userId = req.user._id.toString();
    const userRole = req.user.role || req.user.accountType || req.user.membershipType || req.user.modelType;

    const tag = await Tag.findById(tagId);

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found.' });
    }

    const tagCreatorId = tag.createdBy.toString();

    if (userId !== tagCreatorId && req.user.createdByModel === 'group_member') {
      console.warn(`🚫 Group member ${userId} attempted to remove tag created by ${tagCreatorId}`);
      return res.status(403).json({ message: 'Group members can only remove tags they created.' });
    }

    // Remove topic or unit association
    if (itemType === 'topic') {
      tag.associatedTopics = tag.associatedTopics.filter(id => id.toString() !== itemId);
    } else {
      tag.associatedUnits = tag.associatedUnits.filter(
        u => !(u.item.toString() === itemId && u.unitType === itemType)
      );
    }

    const isNowEmpty =
      tag.associatedUnits.length === 0 &&
      tag.associatedTopics.length === 0 &&
      (!tag.assignedTo || tag.assignedTo.length === 0);

    if (isNowEmpty) {
      await Tag.findByIdAndDelete(tagId);
      console.log(`🗑️ Tag ${tagId} deleted (no associations remain).`);
      return res.status(200).json({ message: 'Tag deleted because no associations remain.' });
    }

    await tag.save();
    return res.status(200).json({ message: 'Tag updated successfully.', tag });

  } catch (error) {
    console.error('❌ Error removing tag:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};









