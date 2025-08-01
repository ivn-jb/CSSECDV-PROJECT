const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv').config();
const connectDB = require('./config/connect');

// Mongoose models
const User = require('./models/users');
const Cookie = require('./models/cookies');
const Order = require('./models/orders');
const Log = require('./models/logs');

const app = express();
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));


// Connect to MongoDB
connectDB();

// Logging helper
const logActivity = async (userId, action, details = '') => {
  await Log.create({
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logActivity(req.user._id, 'Access Control Failure', `Tried accessing a restricted route: ${req.originalUrl}`, 'failure');
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


// Pass models and helpers to routes
require('./routes/auth')(app, { User, bcrypt, jwt, JWT_SECRET, logActivity });
require('./routes/cookies')(app, { Cookie, authenticateToken, requireRole, upload, logActivity });
require('./routes/orders')(app, { Order, Cookie, authenticateToken, requireRole, logActivity });
require('./routes/users')(app, { User, authenticateToken, requireRole, bcrypt, logActivity });
require('./routes/logs')(app, { Log, authenticateToken, requireRole });

// custom error page
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack || err);
  
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ error: 'Something went wrong. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`Cookie Shop server running on port ${PORT}`);
});
