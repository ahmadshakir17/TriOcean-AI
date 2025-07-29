const express = require('express');
const passport = require('passport');
const router = express.Router();

// Login route - redirects to Microsoft
router.get('/microsoft', passport.authenticate('microsoft', {
  scope: ['openid', 'profile', 'email', 'User.Read']
}));

// Microsoft callback route
router.get('/microsoft/callback',
  passport.authenticate('microsoft', {
    failureRedirect: '/auth/login',
    failureFlash: true
  }),
  (req, res) => {
    // Successful authentication
    console.log('✅ User authenticated:', req.user.email);
    res.redirect('/dashboard');
  }
);

// Error handling for OAuth
router.get('/microsoft/callback', (req, res, next) => {
  if (req.query.error) {
    console.error('❌ OAuth Error:', req.query.error);
    console.error('❌ Error Description:', req.query.error_description);
    return res.status(400).json({
      error: 'Authentication failed',
      details: req.query.error_description || req.query.error
    });
  }
  next();
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/auth/login');
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.user_id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Test route to check Azure app configuration
router.get('/test-azure', (req, res) => {
  res.json({
    clientId: process.env.MICROSOFT_CLIENT_ID || '63e28fde-5974-4d71-89f8-cd7fc1f4080e',
    callbackUrl: 'http://localhost:3000/auth/microsoft/callback',
    scopes: ['openid', 'profile', 'email', 'User.Read']
  });
});

// Login page
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '../../login.html'));
});

module.exports = router; 