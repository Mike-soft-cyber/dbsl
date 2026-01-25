
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { newTeacherActivity } = require('../controllers/activityController');

const signup = async (req, res) => {
  console.log('📝 Signup request received:', req.body);

  const { firstName, lastName, phone, role, schoolName, schoolCode, email, password } = req.body;

  
  if (!firstName || !lastName) {
    return res.status(400).json({ message: "First name and Last name are required" });
  }
  
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      role: role || 'Teacher',
      schoolName,
      schoolCode,
      email,
      password: hashedPassword,
      isVerified: true 
    });

    console.log('✅ User created:', newUser._id);

    try {
      await newTeacherActivity({
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        schoolCode: newUser.schoolCode
      });
      console.log('✅ Teacher registration activity logged');
    } catch (activityError) {
      console.error('⚠️ Failed to log teacher activity:', activityError.message);
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      success: true,
      message: "Account created successfully!",
      token: token,
      user: {
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        schoolName: newUser.schoolName,
        schoolCode: newUser.schoolCode,
        phone: newUser.phone,
        profilePic: newUser.profilePic,
        isVerified: true
      }
    });

  } catch (err) {
    console.error('💥 SIGNUP ERROR:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: Object.values(err.errors).map(e => e.message) 
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: "Email or phone already exists" 
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error during signup"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    
    

    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      schoolName: user.schoolName,
      schoolCode: user.schoolCode,
      phone: user.phone,
      profilePic: user.profilePic,
      signupMethod: user.signupMethod,
      isVerified: user.isVerified,
      assignedClasses: user.assignedClasses,
      documentsCreated: user.documentsCreated
    };

    console.log('✅ Login successful for:', user.email);

    res.json({
      message: "Login successful",
      token,
      user: userResponse
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

module.exports = { signup, login };