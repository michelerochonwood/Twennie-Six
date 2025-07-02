const passport = require('passport');




module.exports = {
    // Render the login page
    showLoginForm: (req, res) => {
        console.log('Login page accessed');
        const csrfToken = req.csrfToken ? req.csrfToken() : null;
        res.render('login_views/login_view', {
            layout: 'mainlayout',
            title: 'Login',
            csrfToken,
        });
    },

handleLogin: (req, res, next) => {
  const email = req.body.email.toLowerCase();
  console.log('Login attempt with email:', email);

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err.message);
      return next(err);
    }

    if (!user) {
      return res.status(401).render('login_views/login_view', {
        layout: 'mainlayout',
        title: 'Login',
        error: info?.message || 'Invalid email or password.',
      });
    }

    // ✅ From here on, user is defined
    console.log('--- LOGIN DEBUG ---');
    console.log('Form accessLevel:', req.body.accessLevel);
    console.log('User membershipType:', user.membershipType);
    console.log('User accessLevel:', user.accessLevel);

    const selection = req.body.accessLevel;

    if (user.membershipType === 'member') {
      if (user.accessLevel !== selection) {
        return res.status(401).render('login_views/login_view', {
          layout: 'mainlayout',
          title: 'Login',
          error: 'Please select the correct membership type to log in.'
        });
      }
    } else {
      // Group leaders and members do not have accessLevel
      if (user.membershipType !== selection) {
        return res.status(401).render('login_views/login_view', {
          layout: 'mainlayout',
          title: 'Login',
          error: 'Please select the correct membership type to log in.'
        });
      }
    }

    // ✅ Login the user
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err.message);
        return next(err);
      }

      req.session.user = {
        id: user._id,
        username: user.username,
        membershipType: user.membershipType,
      };

      console.log(`Login successful: ${user.username}`);

      // Redirect based on membershipType
      if (user.membershipType === 'leader') {
        res.redirect('/dashboard/leader');
      } else if (user.membershipType === 'group_member') {
        res.redirect('/dashboard/groupmember');
      } else if (user.membershipType === 'member') {
        res.redirect('/dashboard/member');
      } else {
        res.redirect('/dashboard');
      }
    });
  })(req, res, next);
},



    // Handle logout
    handleLogout: (req, res) => {
        req.logout((err) => {
            if (err) {
                console.error('Logout error:', err.message);
                return res.status(500).render('login_views/error', {
                    layout: 'mainlayout',
                    title: 'Error',
                    errorMessage: 'An error occurred during logout. Please try again.',
                });
            }

            console.log('Logout successful');
            req.session.destroy(() => {
                res.redirect('/auth/login');
            });
        });
    },
};

