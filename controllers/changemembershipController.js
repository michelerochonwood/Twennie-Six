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
  },

  changeToFree: async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.membershipType !== 'member') {
      return res.status(403).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Access Denied',
        errorMessage: 'Only members can switch to free membership.'
      });
    }

    await Member.findByIdAndUpdate(user._id, {
      accessLevel: 'free_individual',
      membershipType: 'member'
    });

    req.session.user.membershipType = 'member';
    req.session.user.accessLevel = 'free_individual';

    res.redirect('/change_membership/success');
  } catch (err) {
    console.error('❌ Error changing to free membership:', err);
    res.status(500).render('member_form_views/error', {
      layout: 'memberformlayout',
      title: 'Error',
      errorMessage: 'Unable to update your membership. Please try again.'
    });
  }
},

changeToIndividual: async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.membershipType !== 'member') {
      return res.status(403).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Access Denied',
        errorMessage: 'Only members can become individual members.'
      });
    }

    await Member.findByIdAndUpdate(user._id, {
      accessLevel: 'paid_individual',
      membershipType: 'member'
    });

    req.session.user.membershipType = 'member';
    req.session.user.accessLevel = 'paid_individual';

    res.redirect('/change_membership/success');
  } catch (err) {
    console.error('❌ Error changing to individual membership:', err);
    res.status(500).render('member_form_views/error', {
      layout: 'memberformlayout',
      title: 'Error',
      errorMessage: 'Unable to update your membership. Please try again.'
    });
  }
},

changeToLeader: async (req, res) => {
  try {
    const user = req.user;

    if (!user || user.membershipType !== 'member') {
      return res.status(403).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Access Denied',
        errorMessage: 'Only members can become leaders from this form.'
      });
    }

    const {
      groupName,
      groupLeaderName,
      professionalTitle,
      organization,
      industry,
      username,
      groupLeaderEmail,
      password,
      groupSize,
      registration_code
    } = req.body;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the leader
    const newLeader = new Leader({
      groupName,
      groupLeaderName,
      professionalTitle,
      organization,
      industry,
      username,
      groupLeaderEmail,
      password: hashedPassword,
      groupSize,
      registration_code,
      isActive: true,
      membershipType: 'leader',
      accessLevel: 'leader',
      paymentStatus: 'pending'
    });

    await newLeader.save();

    // Deactivate old member record
    await Member.findByIdAndUpdate(user._id, { isActive: false });

    // Update session
    req.session.user = {
      _id: newLeader._id,
      membershipType: 'leader',
      accessLevel: 'leader',
      username: newLeader.username,
      email: newLeader.groupLeaderEmail
    };

    return res.redirect('/change_membership/success');
  } catch (err) {
    console.error('❌ Error changing to leader:', err);
    return res.status(500).render('member_form_views/error', {
      layout: 'memberformlayout',
      title: 'Error Changing Membership',
      errorMessage: 'An error occurred while registering you as a group leader. Please try again.'
    });
  }
}

};

