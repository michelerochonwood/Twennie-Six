// controllers/changemembershipController.js

const CancelledMember = require('../models/member_models/cancelledmember');
const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');

module.exports = {
  showChangeMembershipForm: (req, res) => {
    if (!req.user) {
      return res.status(401).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Unauthorized',
        errorMessage: 'You must be logged in to change your membership.'
      });
    }

    res.render('member_form_views/change_my_membership', {
      layout: 'memberformlayout',
      csrfToken: req.csrfToken(),
      user: req.user
    });
  },

  cancelMembership: async (req, res) => {
    try {
      const user = req.user;
      const reason = req.body.reason || '';

      if (!user) {
        return res.status(401).render('member_form_views/error', {
          layout: 'memberformlayout',
          title: 'Unauthorized',
          errorMessage: 'You must be logged in to cancel your membership.'
        });
      }

      const CancelRecord = new CancelledMember({
        originalId: user._id,
        name: user.name || user.groupLeaderName,
        username: user.username,
        email: user.email || user.groupLeaderEmail,
        membershipType: user.membershipType,
        accessLevel: user.accessLevel || null,
        wasLeader: user.membershipType === 'leader',
        reason
      });

      await CancelRecord.save();

      // Deactivate the user's record
      switch (user.membershipType) {
        case 'member':
          await Member.findByIdAndUpdate(user._id, { isActive: false });
          break;
        case 'leader':
          await Leader.findByIdAndUpdate(user._id, { isActive: false });
          break;
        case 'group_member':
          await GroupMember.findByIdAndUpdate(user._id, { isActive: false });
          break;
        default:
          console.warn('⚠️ Unknown membership type during cancellation:', user.membershipType);
      }

      // End session and redirect to cancel success
      req.session.destroy(() => {
        res.render('member_form_views/cancel_success', {
          layout: 'memberformlayout',
          title: 'Membership Cancelled'
        });
      });

    } catch (err) {
      console.error('❌ Error cancelling membership:', err);
      res.status(500).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Error Cancelling Membership',
        errorMessage: 'An error occurred while cancelling your membership. Please try again.'
      });
    }
  },

  changeSuccess: (req, res) => {
    const username = req.session.user?.username || 'User';
    const membershipType = req.session.user?.membershipType;

    const dashboardLink =
      membershipType === 'leader'
        ? '/dashboard/leader'
        : membershipType === 'group_member'
          ? '/dashboard/group'
          : '/dashboard/member';

    res.render('member_form_views/change_success', {
      layout: 'memberformlayout',
      title: 'Membership Updated',
      username,
      dashboardLink
    });
  }
};

