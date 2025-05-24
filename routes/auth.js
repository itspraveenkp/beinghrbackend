const express = require('express');
const passport = require('passport');

const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Redirect to frontend with user data (you need to send a token in req.user)
    res.redirect(`${process.env.FRONTEND_URL}?token=${req.user.token}`);
  }
);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.redirect(process.env.FRONTEND_URL); // Redirect to frontend
    });
  });
});

// @desc    Get current user
// @route   GET /auth/user
router.get('/user', (req, res) => {
  res.send(req.user); // Sends user details to frontend
});

module.exports = router;
