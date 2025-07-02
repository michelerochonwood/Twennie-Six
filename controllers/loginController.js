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
  const selectedAccessLevel = req.body.accessLevel;

  console.log('Login attempt with email:', email);

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err.message);
      return next(err);
    }

    if (!user) {
      console.warn(`Login failed for ${email}: Invalid credentials`);
      return res.status(401).render('login_views/login_view', {
        layout: 'mainlayout',
        title: 'Login',
        error: info?.message || 'Invalid email or password.',
      });
    }

    // ✅ Log form and user values for debugging
    console.log('--- LOGIN DEBUG ---');
    console.log('Form accessLevel:', selectedAccessLevel);
    console.log('User accessLevel:', user.accessLevel);
    console.log('User membershipType:', user.membershipType);

    // ✅ Check that selected value matches user's accessLevel
    if (user.accessLevel !== selectedAccessLevel) {
      console.warn(`Access level mismatch: form=${selectedAccessLevel}, user=${user.accessLevel}`);
      return res.status(401).render('login_views/login_view', {
        layout: 'mainlayout',
        title: 'Login',
        error: 'Please select the correct membership type to log in.'
      });
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

      // ✅ Redirect by membershipType
      switch (user.membershipType) {
        case 'leader':
          return res.redirect('/dashboard/leader');
        case 'group_member':
          return res.redirect('/dashboard/groupmember');
        case 'member':
          return res.redirect('/dashboard/member');
        default:
          console.warn(`Unknown membership type for ${user.username}, redirecting to default dashboard.`);
          return res.redirect('/dashboard');
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

