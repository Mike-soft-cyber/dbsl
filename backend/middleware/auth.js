

const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token in authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ Token verified for user:', decoded.email);
    
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;