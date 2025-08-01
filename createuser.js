const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv').config();
// const User = require('./models/users'); // Adjust if your model path is different

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, {
// //   useNewUrlParser: true,
// //   useUnifiedTopology: true
// }).then(async () => {
//   console.log('Connected to MongoDB');

//   // Hash passwords
//   const adminHashed = await bcrypt.hash('admin123', 10);
//   const managerHashed = await bcrypt.hash('manager123', 10);

//   // Define users
//   const users = [
//     {
//       username: 'admin',
//       email: 'admin@example.com',
//       password: adminHashed,
//       role: 'admin'
//     },
//     {
//       username: 'manager',
//       email: 'manager@example.com',
//       password: managerHashed,
//       role: 'manager'
//     }
//   ];

//   // Insert users
//   for (const userData of users) {
//     const exists = await User.findOne({ username: userData.username });
//     if (exists) {
//       console.log(`User '${userData.username}' already exists. Skipping...`);
//     } else {
//       const newUser = new User(userData);
//       await newUser.save();
//       console.log(`Created user '${newUser.username}' with role '${newUser.role}'`);
//     }
//   }

//   mongoose.disconnect();
// }).catch(err => {
//   console.error('MongoDB connection error:', err);
// });

const connectDB = require('./config/connect');
const User = require('./models/users');

(async () => {
  try {
    await connectDB();

    // Hash passwords
  const adminHashed = await bcrypt.hash('admin123', 10);
  const managerHashed = await bcrypt.hash('manager123', 10);

  // Define users
  const users = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: adminHashed,
      role: 'admin'
    },
    {
      username: 'manager',
      email: 'manager@example.com',
      password: managerHashed,
      role: 'manager'
    }
  ];

  // Insert users
  for (const userData of users) {
    const exists = await User.findOne({ username: userData.username });
    if (exists) {
      console.log(`User '${userData.username}' already exists. Skipping...`);
    } else {
      const newUser = new User(userData);
      await newUser.save();
      console.log(`Created user '${newUser.username}' with role '${newUser.role}'`);
    }
  }

  console.log("Test user saved to MongoDB");
    process.exit(); 

  } catch (err) {
    console.error("Error saving user:", err);
    process.exit(1);
  }
})();
