module.exports = (app, { authenticateToken, requireRole, bcrypt, logActivity, User }) => {

  // Get all users (Admin only)
  app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const users = await User.find({}, '-password');
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get customers (Manager/Admin only)
  app.get('/api/customers', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const customers = await User.find({ role: 'customer' }, '-password -role');
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create user (Admin only)
  app.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { username, password, email, role } = req.body;

      if (!username || !password || !email || !role) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const validRoles = ['admin', 'manager'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Only admin and manager roles can be created.' });
      }

      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        password: hashedPassword,
        email,
        role,
        createdAt: new Date().toISOString()
      });

      await newUser.save();

      await logActivity(req.user.id, 'CREATE_USER', `Created ${role} user: ${username}`);

      res.json({
        message: 'User created successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update user role (Admin only)
  app.put('/api/users/:id/role', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { role } = req.body;
      const validRoles = ['admin', 'manager', 'customer'];

      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent admin from changing their own role
      if (user._id.equals(req.user.id)) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const oldRole = user.role;
      user.role = role;
      user.updatedAt = new Date().toISOString();

      await user.save();

      await logActivity(req.user.id, 'UPDATE_USER_ROLE', `Changed user ${user.username} role from ${oldRole} to ${role}`);

      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete user (Admin only)
  app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent admin from deleting themselves
      if (user._id.equals(req.user.id)) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await user.deleteOne();

      await logActivity(req.user.id, 'DELETE_USER', `Deleted user: ${user.username}`);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Disable/Enable customer account (Manager/Admin only)
  app.put('/api/customers/:id/status', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const { disabled } = req.body;

      if (typeof disabled !== 'boolean') {
        return res.status(400).json({ error: 'Disabled status must be a boolean' });
      }

      const user = await User.findOne({ _id: req.params.id, role: 'customer' });

      if (!user) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      user.disabled = disabled;
      user.updatedAt = new Date().toISOString();

      await user.save();

      const action = disabled ? 'DISABLE_CUSTOMER' : 'ENABLE_CUSTOMER';
      await logActivity(req.user.id, action, `${disabled ? 'Disabled' : 'Enabled'} customer: ${user.username}`);

      res.json({ message: `Customer ${disabled ? 'disabled' : 'enabled'} successfully` });
    } catch (error) {
      console.error('Update customer status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
