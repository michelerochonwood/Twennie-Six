// routes/mfaroutes.js
const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');

// Models
const Leader = require('../../models/member_models/leader');
const Member = require('../../models/member_models/member');
const GroupMember = require('../../models/member_models/group_member');

// Utils
const {
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyRecoveryCode,
} = require('../../utils/cryptoMfa');

// ---- helpers ----
const byRole = {
  leader: Leader,
  member: Member,
  group_member: GroupMember,
};

// basic auth gate
function isAuthenticated(req, res, next) {
  if (req.session?.user) return next();
  return res.redirect('/auth/login');
}

// Resolve the current user doc + model by role in session
async function getCurrentUserDoc(req) {
  const role = req.session?.user?.accessLevel || req.session?.user?.role;
  const userId = req.session?.user?.id;

  let key = role;
  if (role === 'free_individual' || role === 'contributor_individual' || role === 'paid_individual') key = 'member';
  else if (role === 'leader') key = 'leader';
  else if (role === 'group_member') key = 'group_member';

  const Model = byRole[key];
  if (!Model || !userId) return null;
  const doc = await Model.findById(userId);
  return { doc, Model, role: key };
}

// IMPORTANT: default to '/mfa' since we're mounted at /mfa
function ctxBaseUrl(req) {
  return req.baseUrl || '/mfa';
}

/* =========================
   UI: MFA settings page
   ========================= */
// GET /mfa
router.get('/', isAuthenticated, async (req, res) => {
  const ctx = await getCurrentUserDoc(req);
  if (!ctx || !ctx.doc) return res.redirect('/auth/login');

  return res.render('auth_views/mfa_settings', {
    layout: 'dashboardlayout',
    title: 'Multi-Factor Authentication',
    mfaEnabled: !!ctx.doc.mfa?.enabled,
    baseUrl: ctxBaseUrl(req),
  });
});

// Optional alias: GET /mfa/settings
router.get('/settings', isAuthenticated, async (req, res) => {
  const ctx = await getCurrentUserDoc(req);
  if (!ctx || !ctx.doc) return res.redirect('/auth/login');

  return res.render('auth_views/mfa_settings', {
    layout: 'dashboardlayout',
    title: 'Multi-Factor Authentication',
    mfaEnabled: !!ctx.doc.mfa?.enabled,
    baseUrl: ctxBaseUrl(req),
  });
});

/* ======================================================
   Step 1: Begin setup (generate secret + QR)
   POST /mfa/setup
   ====================================================== */
router.post('/setup', isAuthenticated, async (req, res) => {
  const ctx = await getCurrentUserDoc(req);
  if (!ctx || !ctx.doc) return res.redirect('/auth/login');

  const labelName = `Twennie (${ctx.doc.username || ctx.doc.groupLeaderName || ctx.doc.name || 'user'})`;
  const secret = speakeasy.generateSecret({ name: labelName, issuer: 'Twennie', length: 20 });

  req.session.mfaSetup = { base32: secret.base32, otpauth_url: secret.otpauth_url };
  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

  return res.render('auth_views/mfa_setup', {
    layout: 'dashboardlayout',
    title: 'Set up MFA',
    qrDataUrl,
    manualKey: secret.base32,
    baseUrl: ctxBaseUrl(req),
  });
});

/* ======================================================
   Step 2: Verify setup token & save
   POST /mfa/verify-setup
   ====================================================== */
router.post('/verify-setup', isAuthenticated, async (req, res) => {
  const ctx = await getCurrentUserDoc(req);
  if (!ctx || !ctx.doc) return res.redirect('/auth/login');

  const userToken = (req.body?.token || '').trim();
  const setup = req.session.mfaSetup;

  if (!setup?.base32 || !userToken) {
    return res.status(400).render('member_form_views/error', {
      layout: 'mainlayout',
      title: 'Error',
      errorMessage: 'Invalid MFA setup session or token.',
    });
  }

  const ok = speakeasy.totp.verify({ secret: setup.base32, encoding: 'base32', token: userToken, window: 1 });

  if (!ok) {
    return res.render('auth_views/mfa_setup', {
      layout: 'dashboardlayout',
      title: 'Set up MFA',
      qrDataUrl: await qrcode.toDataURL(setup.otpauth_url),
      manualKey: setup.base32,
      error: 'Code did not match. Try again.',
      baseUrl: ctxBaseUrl(req),
    });
  }

  // Persist encrypted secret + recovery codes
  const enc = encryptSecret(setup.base32);
  const rawCodes = generateRecoveryCodes(10);
  const hashedCodes = await hashRecoveryCodes(rawCodes);

  ctx.doc.mfa = {
    enabled: true,
    method: 'totp',
    secretEnc: enc.secretEnc,
    secretIv: enc.secretIv,
    secretTag: enc.secretTag,
    recoveryCodes: hashedCodes,
    updatedAt: new Date(),
  };
  await ctx.doc.save();

  delete req.session.mfaSetup;

  return res.render('auth_views/mfa_setup_success', {
    layout: 'dashboardlayout',
    title: 'MFA Enabled',
    recoveryCodes: rawCodes, // show once
    dashboard: '/dashboard/leader',
    baseUrl: ctxBaseUrl(req),
  });
});

/* ===============================================
   Disable MFA (require a current code)
   POST /mfa/disable
   =============================================== */
router.post('/disable', isAuthenticated, async (req, res) => {
  const ctx = await getCurrentUserDoc(req);
  if (!ctx || !ctx.doc || !ctx.doc.mfa?.enabled) return res.redirect('/auth/login');

  const token = (req.body?.token || '').trim();

  const secret = decryptSecret({
    secretEnc: ctx.doc.mfa.secretEnc,
    secretIv: ctx.doc.mfa.secretIv,
    secretTag: ctx.doc.mfa.secretTag,
  });

  const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });

  if (!ok) {
    return res.render('auth_views/mfa_settings', {
      layout: 'dashboardlayout',
      title: 'Multi-Factor Authentication',
      mfaEnabled: true,
      error: 'Invalid MFA code. Try again.',
      baseUrl: ctxBaseUrl(req),
    });
  }

  ctx.doc.mfa = {
    enabled: false,
    method: undefined,
    secretEnc: undefined,
    secretIv: undefined,
    secretTag: undefined,
    recoveryCodes: [],
    updatedAt: new Date(),
  };
  await ctx.doc.save();

  return res.render('auth_views/mfa_disable_success', {
    layout: 'dashboardlayout',
    title: 'MFA Disabled',
    dashboard: '/dashboard/leader',
    baseUrl: ctxBaseUrl(req),
  });
});

/* ======================================================
   Login challenge (after password)
   GET/POST /mfa/challenge
   ====================================================== */
router.get('/challenge', async (req, res) => {
  if (!req.session?.pendingMfa?.userId || !req.session?.pendingMfa?.role) {
    return res.redirect('/auth/login');
  }
  return res.render('auth_views/mfa_challenge', {
    layout: 'mainlayout',
    title: 'Verify MFA',
    baseUrl: ctxBaseUrl(req),
  });
});

router.post('/challenge', async (req, res) => {
  const pending = req.session?.pendingMfa;
  if (!pending?.userId || !pending?.role) return res.redirect('/auth/login');

  const Model = byRole[pending.role];
  const userDoc = await Model.findById(pending.userId);
  if (!userDoc || !userDoc.mfa?.enabled) {
    req.session.user = pending.user;
    delete req.session.pendingMfa;
    return res.redirect(pending.redirectTo || '/');
  }

  const token = (req.body?.token || '').trim();
  const secret = decryptSecret({
    secretEnc: userDoc.mfa.secretEnc,
    secretIv: userDoc.mfa.secretIv,
    secretTag: userDoc.mfa.secretTag,
  });

  let ok = false;
  if (token.includes('-')) {
    const idx = await verifyRecoveryCode(token.toUpperCase(), userDoc.mfa.recoveryCodes);
    if (idx >= 0) {
      ok = true;
      userDoc.mfa.recoveryCodes.splice(idx, 1); // single-use
      await userDoc.save();
    }
  } else {
    ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  }

  if (!ok) {
    return res.render('auth_views/mfa_challenge', {
      layout: 'mainlayout',
      title: 'Verify MFA',
      error: 'Invalid code. Try again or use a recovery code.',
      baseUrl: ctxBaseUrl(req),
    });
  }

  // Promote pending to fully logged in
  req.session.user = pending.user;
  delete req.session.pendingMfa;

  return res.redirect(pending.redirectTo || '/');
});

module.exports = router;

