const express = require('express');
const router = express.Router();
const user = require('../controllers/authController');
const passport = require('passport');
const jwt = require('jsonwebtoken');

//app.use('/api/user')
router.post('/register', user.signup);
router.post('/login', user.login);

// Google OAuth routes
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['email', 'profile'],
        session: false 
    })
);

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  async (req, res) => {
    try {
      const user = req.user;
      
      console.log('=== GOOGLE CALLBACK DEBUG ===');
      console.log('User ID:', user._id);
      console.log('Email:', user.email);
      console.log('School Name:', user.schoolName);
      console.log('School Code:', user.schoolCode);
      console.log('Phone:', user.phone);
      console.log('User profilePic from DB:', user.profilePic);
      console.log('ProfilePic type:', typeof user.profilePic);
      console.log('ProfilePic starts with http?', user.profilePic?.startsWith('http'));
      console.log('============================');
      
      // Check if profile has REAL values (not placeholders)
      const isPlaceholderSchool = user.schoolName === 'Pending Setup' || user.schoolCode === 'PENDING';
      const isPlaceholderPhone = user.phone === '0000000000' || user.phone === '';
      const hasRealSchoolInfo = user.schoolName && user.schoolCode && 
                               !isPlaceholderSchool && !isPlaceholderPhone;
      
      console.log('Is placeholder school?', isPlaceholderSchool);
      console.log('Is placeholder phone?', isPlaceholderPhone);
      console.log('Has real school info?', hasRealSchoolInfo);
      
      // Also check the needsCompleteProfile flag if you added it
      const needsCompletion = user.needsCompleteProfile === true || 
                             !hasRealSchoolInfo;
      
      console.log('Needs profile completion?', needsCompletion);
      
      if (needsCompletion) {
        console.log('❌ Profile incomplete - redirecting to complete-profile');
        const tempToken = jwt.sign(
          { 
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePic: user.profilePic,
            needsProfile: true
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
        
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(
          `${frontendURL}/complete-profile?token=${tempToken}`
        );
      }
      
      console.log('✅ Profile complete - logging in directly');
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendURL}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}`
      );
      
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;