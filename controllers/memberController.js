const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const MemberProfile = require('../models/profile_models/member_profile');
const { validateMemberData } = require('../utils/validateMember');
const bcrypt = require('bcrypt');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

module.exports = {
showMemberForm: (req, res) => {
  res.render('member_form_views/member_form', {
    layout: 'memberformlayout',
    title: 'Individual Membership Form',
    csrfToken: req.csrfToken(), // ✅ Generate token directly here
  });
},

  createMember: async (req, res) => {
    try {
      const {
        name,
        professionalTitle,
        organization,
        industry,
        username,
        email,
        password,
        topic1,
        topic2,
        topic3,
        accessLevel
      } = req.body;

      console.log('Received registration data:', { name, username, email, accessLevel });

      // ✅ Validate input
      const errors = validateMemberData(req.body);
      if (errors.length > 0) {
        console.warn('Validation errors:', errors);
        return res.status(400).render('member_form_views/member_form', {
          layout: 'memberformlayout',
          title: 'Individual Membership Form',
          errors,
          data: req.body,
        });
      }

      // ✅ Secure password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Create Member
      const newMember = new Member({
        name,
        professionalTitle,
        organization,
        industry,
        username,
        email,
        password: hashedPassword,
        topics: { topic1, topic2, topic3 },
        accessLevel: accessLevel || 'free_individual',
        membershipType: 'member',
      });

      await newMember.save();
      console.log('✅ Member saved:', newMember._id);

      // ✅ Create Profile
      const memberProfile = new MemberProfile({
        memberId: newMember._id,
        name: newMember.name,
        professionalTitle: newMember.professionalTitle,
        profileImage: "/images/default-avatar.png",
        biography: "",
        goals: "",
topics: (topic1 || topic2 || topic3)
  ? { topic1: topic1 || "", topic2: topic2 || "", topic3: topic3 || "" }
  : undefined,
      });

      await memberProfile.save();
      console.log(`✅ Member Profile Created: ${memberProfile._id}`);

      // ✅ Store session
      req.session.user = {
        id: newMember._id,
        username: newMember.username,
        membershipType: newMember.membershipType,
      };

      // ✅ Redirect to Stripe if paid
      if (accessLevel === 'paid_individual') {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price_data: {
                currency: 'cad',
                unit_amount: 1700, // $17.00 CAD in cents
                recurring: { interval: 'month' },
                product_data: {
                  name: 'Twennie Paid Individual Membership',
                },
                tax_behavior: 'exclusive',
              },
              quantity: 1,
            },
          ],
          automatic_tax: { enabled: true },
          billing_address_collection: 'required',
          success_url: `${baseUrl}/member/payment/success`,
          cancel_url: `${baseUrl}/member/payment/cancel`,
        });

        return res.redirect(303, session.url);
      }

      // ✅ Free or Contributor — show success
      res.render("member_form_views/register_success", {
        layout: "memberformlayout",
        title: "Registration Successful",
        username: newMember.username,
        user: newMember,
        dashboardLink: "/dashboard/member"
      });

    } catch (err) {
      console.error('❌ Error creating member:', err);
      res.status(500).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Registration Error',
        errorMessage: 'An error occurred while creating the member. Please try again.',
      });
    }
  },

  convertToLeader: async (req, res) => {
    try {
      const memberId = req.session.user?.id;
      if (!memberId) {
        return res.status(401).render('member_form_views/error', {
          layout: 'memberformlayout',
          title: 'Unauthorized',
          errorMessage: 'You must be logged in to convert your membership.',
        });
      }
  
      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).render('member_form_views/error', {
          layout: 'memberformlayout',
          title: 'Member Not Found',
          errorMessage: 'Your account could not be found.',
        });
      }
  
      const {
        groupName,
        groupLeaderName,
        organization,
        industry,
        groupSize,
        registration_code,
        topic1,
        topic2,
        topic3,
        group_agreement,
        redirectTarget
      } = req.body;
  
      if (!group_agreement) {
        return res.status(400).render('member_form_views/error', {
          layout: 'memberformlayout',
          title: 'Agreement Required',
          errorMessage: 'You must agree to the leadership responsibilities to proceed.',
        });
      }
  
      const newLeader = new Leader({
        groupName,
        groupLeaderName,
        organization,
        industry,
        email: member.email,
        username: member.username,
        password: member.password,
        groupLeaderEmail: member.email, // ✅ Fix
        professionalTitle: member.professionalTitle, // ✅ Fix
        groupSize,
        registration_code,
        profileImage: member.profileImage || "/images/default-avatar.png",
        topics: { topic1, topic2, topic3 },
        membershipType: 'leader',
        accessLevel: 'paid_leader'
      });
  
      await newLeader.save();
      console.log('✅ Leader created:', newLeader._id);
  
      // Soft archive the member account
      member.isActive = false;
      await member.save();
      console.log(`🔒 Archived member account: ${member._id}`);
  
      // Update session
      req.session.user = {
        id: newLeader._id,
        username: newLeader.username,
        membershipType: 'leader'
      };
  
      // Handle Stripe redirect
      if (redirectTarget === 'payment') {
        const quantity = parseInt(groupSize, 10) || 1;
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price_data: {
                currency: 'cad',
                unit_amount: 1700, // $17.00 CAD in cents
                recurring: { interval: 'month' },
                product_data: {
                  name: 'Twennie Group Leader Membership',
                },
                tax_behavior: 'exclusive',
              },
              quantity: quantity,
            },
          ],
          automatic_tax: { enabled: true },
          billing_address_collection: 'required',
          success_url: `${baseUrl}/member/payment/success`,
          cancel_url: `${baseUrl}/member/payment/cancel`,
        });
  
        return res.redirect(303, session.url);
      }
  
      res.redirect('/dashboard/leader');
  
    } catch (err) {
      console.error('❌ Error converting to leader:', err);
      res.status(500).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Conversion Error',
        errorMessage: 'An error occurred while converting your membership. Please try again.',
      });
    }
  }
  
};



