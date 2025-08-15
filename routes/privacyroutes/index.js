// routes/privacy.js
const router = require('express').Router();

router.get('/cookies', (req, res) => {
  const csrfToken = req.csrfToken ? req.csrfToken() : null;
  res.render('privacy/cookies', { layout: 'mainlayout', title: 'Cookie Preferences', csrfToken, currentConsent: res.locals.consent });
});

router.post('/cookies', async (req, res) => {
  const { functional, analytics, marketing } = req.body; // 'on' or undefined
  const consent = {
    version: 1, necessary: true,
    functional: !!functional, analytics: !!analytics, marketing: !!marketing,
    updatedAt: new Date().toISOString()
  };

  res.cookie('twennieConsent', JSON.stringify(consent), {
    httpOnly: false, // client must read it to hide banner
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 1000 * 60 * 60 * 24 * 180
  });

  // If logged in, persist a copy server-side (audit trail & default across devices)
  try {
    const u = req.session?.user;
    if (u?.id) {
      // pick correct model by role if you like; example below assumes a generic “byRole” chooser
      // await Model.updateOne({_id: u.id}, {$set: { cookieConsent: consent, cookieConsentUpdatedAt: new Date() }});
    }
  } catch {}

  res.redirect('/privacy/cookies');
});

module.exports = router;


