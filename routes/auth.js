module.exports = (app, { User, bcrypt, jwt, JWT_SECRET, logActivity }) => {

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });

      if (!user) {
        await logActivity(null, 'FAILED LOGIN', `User ${username} tried to log in`);
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const waitTime = Math.ceil((user.lockUntil - Date.now()) / 1000);
        await logActivity(user._id, 'LOCKED ACCOUNT LOGIN ATTEMPT', `Locked user ${username} tried to log in`)
        return res.status(403).json({ error: `Account locked. Try again later.` });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        console.log('Before:', user.failedLoginAttempts);
        user.lastFailedLogin = new Date();
        user.failedLoginAttempts += 1;
        console.log('After:', user.failedLoginAttempts);
        await logActivity(user._id, 'INVALID PASSWORD', `User ${username} logged in with incorrect password`)

        if (user.failedLoginAttempts >= 5) {
          // Lock account for 15 minutes
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await user.save();
          await logActivity(user._id, 'ACCOUNT LOCKED', `User ${username} locked due to too many failed attempts`)
          return res.status(403).json({ error: 'Too many failed attempts. Account locked.' });
        }
        
        await user.save();
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Reset failed attempts on success

      user.previousLogin = user.lastLogin;
      user.lastLogin = new Date();
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // Set to true in production
        maxAge: 24 * 60 * 60 * 1000
      });

      await logActivity(user._id, 'LOGIN', `User ${username} logged in`);
      console.log('Generated Token:', token);

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          email: user.email,
          lastLogin: user.lastLogin,
          previousLogin: user.previousLogin,
          lastFailedLogin: user.lastFailedLogin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // Register (Customer only)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, email } = req.body;

      if (!username || !password || !email) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        await logActivity(user._id, 'DUPLICATE REGISTER', `User ${username} tried to register again.`)
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        password: hashedPassword,
        email,
        role: 'customer',
        createdAt: new Date()
      });

      await newUser.save();

      await logActivity(newUser._id, 'REGISTER', `New customer registered: ${username}`);

      res.json({ message: 'Registration successful' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout
  app.post('/api/auth/logout', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      await logActivity(user._id, 'LOGOUT', `User ${user.username} logged out.`);
    } catch (error) {
      console.error('Logging logout failed:', error);

    }

    res.clearCookie('token', {
    httpOnly: true,
    secure: false, // must match original
  });
    res.json({ message: 'Logout successful' });
  });

  // Get current user
  app.get('/api/auth/me', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        lastChangePwrd: user.lastChangePwrd,
        lastLogin: user.lastLogin,
        lastFailedLogin: user.lastFailedLogin,
        previousLogin: user.previousLogin
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Change password
  app.put('/api/auth/change-password', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        
        return res.status(400).json({ error: 'Both current and new passwords are required' });
      }

      

      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check password age policy
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      if (user.lastChangePwrd && (Date.now() - new Date(user.lastChangePwrd).getTime()) < ONE_DAY_MS) {
        await logActivity(user._id, 'FAILED CHANGE PWRD ATTEMPT', `User ${user.username} attempted to change password while account is locked.`);
        return res.status(400).json({
          error: 'Password was recently changed. Please wait at least 1 day before changing it again.'
        });
      }

      // Check password reuse
      const hashes = [user.password, ...(user.passwordHistory || [])];
      const comparisons = await Promise.all(hashes.map(hash => bcrypt.compare(newPassword, hash)));

      if (comparisons.some(match => match)) {
        await logActivity(user._id, 'FAILED CHANGE PWRD', `User ${user.username} attempted to re-use old password.`);
        return res.status(400).json({ error: 'New password must not match any previously used password.' });
      }


      // Save current password to history before updating
      if (!user.passwordHistory) user.passwordHistory = [];
      user.passwordHistory.unshift(user.password); // Add current to history
      if (user.passwordHistory.length > 5) user.passwordHistory.pop(); // Limit to last 5 passwords

      const validPassword = await bcrypt.compare(currentPassword, user.password);

      if (!validPassword) {
        await logActivity(user._id, 'FAILED CHANGE PWRD', `User ${user.username} failed password verification for password change.`);
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.lastChangePwrd = new Date();
      await user.save();

      await logActivity(user._id, 'PASSWORD_CHANGE', `Password changed for user ${user.username}`);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Fetch security questions
  app.get('/api/auth/security-question', async (req, res) => {
    const { username } = req.query;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.securityQuestion1 || !user.securityQuestion2)
      return res.status(404).json({ error: 'Security questions not set' });

    res.json({ question1: user.securityQuestion1, question2: user.securityQuestion2 });
  });

  // Verify answers
  app.post('/api/auth/verify-answers', async (req, res) => {
    const { username, answer1, answer2 } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match1 = await bcrypt.compare(answer1, user.securityAnswer1 || '');
    const match2 = await bcrypt.compare(answer2, user.securityAnswer2 || '');

    if (match1 && match2) {
      return res.json({ message: 'Verified' });
    } else {
      await logActivity(user._id, 'FAILED SECURITY ANSWER', `User ${user.username} failed security answer verification.`);
      return res.status(401).json({ message: 'Incorrect answers' });
    }
  });

  // Reset password via verified security answers
  app.post('/api/auth/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    if (user.lastChangePwrd && (Date.now() - new Date(user.lastChangePwrd).getTime()) < ONE_DAY_MS) {
      await logActivity(user._id, 'FAILED CHANGE PWRD ATTEMPT', `User ${user.username} attempted to change password while account is locked.`);
      return res.status(400).json({
        message: 'Password was recently changed. Please wait at least 1 day before changing it again.'
      });
    }

    // Check password reuse
    const hashes = [user.password, ...(user.passwordHistory || [])];
    const comparisons = await Promise.all(hashes.map(hash => bcrypt.compare(newPassword, hash)));

    if (comparisons.some(match => match)) {
      await logActivity(user._id, 'FAILED CHANGE PWRD', `User ${user.username} attempted to re-use old password.`);
      return res.status(400).json({ message: 'New password must not match any previously used password.' });
    }

    

    // Save current password to history before updating
    if (!user.passwordHistory) user.passwordHistory = [];
    user.passwordHistory.unshift(user.password); // Add current to history
    if (user.passwordHistory.length > 5) user.passwordHistory.pop(); // Limit to last 5 passwords

    await logActivity(user._id, 'PASSWORD_CHANGE', `Password changed for user ${user.username} through security answers`);
    
    user.password = await bcrypt.hash(newPassword, 10);
    user.lastChangePwrd = new Date();
    await user.save();
    res.json({ message: 'Password reset successful' });
  });

  app.post('/api/auth/set-security-questions', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { question1, answer1, question2, answer2, password } = req.body;

      if (!question1 || !answer1 || !question2 || !answer2 || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Block if already set (optional, remove if re-setting is allowed)
      if (user.securityAnswer1 && user.securityAnswer2) {
        return res.status(403).json({ error: 'Security questions already set' });
      }

      // Confirm password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        await logActivity(user._id, 'FAILED SECURITY QUESTION SET', `User ${user.username} failed to set security questions because password is incorrect.`);
        return res.status(403).json({ error: 'Password is incorrect' });
      }

      // Validate answers
      const isValidAnswer = (ans) => {
        return typeof ans === 'string' && ans.length >= 3 && /^[a-zA-Z0-9\s!?@#%&\-_,.]+$/.test(ans);
      };

      if (!isValidAnswer(answer1) || !isValidAnswer(answer2)) {
        return res.status(400).json({ error: 'Answers must be at least 3 characters and contain only letters, numbers, or basic punctuation.' });
      }

      // Save hashed answers
      user.securityQuestion1 = question1;
      user.securityAnswer1 = await bcrypt.hash(answer1, 10);
      user.securityQuestion2 = question2;
      user.securityAnswer2 = await bcrypt.hash(answer2, 10);
      user.lastChangePwrd = new Date(); // marks initial security setup

      await user.save();
      await logActivity(user._id, 'SECURITY QUESTION SET', `User ${user.username} set security questions successfully.`);
      res.json({ message: 'Security questions updated successfully' });

    } catch (err) {
      console.error('Set security questions error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/reauthenticate', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const { password } = req.body;

      // You need to explicitly select password
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await logActivity(user._id, 'FAILED REAUTHENTICATION', `User ${user.username} failed reauthentication.`);
        return res.status(401).json({ error: 'Incorrect password' });
      }

      res.sendStatus(200); // Re-auth successful
    } catch (err) {
      console.error('Re-authentication error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

};
