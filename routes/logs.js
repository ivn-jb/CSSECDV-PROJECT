const Log = require('../models/logs'); // Adjust path as needed
const User = require('../models/users');

module.exports = (app, { authenticateToken, requireRole }) => {

  // Get logs (Admin only)
  app.get('/api/logs', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { startDate, endDate, userId, action } = req.query;
      const filter = {};

      if (startDate) {
        filter.timestamp = { ...filter.timestamp, $gte: new Date(startDate) };
      }
      if (endDate) {
        filter.timestamp = { ...filter.timestamp, $lte: new Date(endDate) };
      }

      // Look up user by username if userId is provided
      if (userId) {
        const user = await User.findOne({ username: userId }).lean();
        if (user) {
          filter.userId = user._id;
        } else {
          // No such user, return empty result
          return res.json([]);
        }
      }

      if (action) {
        filter.action = { $regex: action, $options: 'i' };
      }

      const logs = await Log.find(filter)
        .sort({ timestamp: -1 })
        .populate('userId', 'username role')
        .lean();

      const logsWithUser = logs.map(log => ({
        ...log,
        username: log.userId?.username || 'Unknown',
        userRole: log.userId?.role || 'Unknown',
        userId: log.userId?._id || log.userId
      }));

      res.json(logsWithUser);
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get log statistics (Admin only)
  app.get('/api/logs/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const logs = await Log.find().populate('userId', 'username').lean();

      const todayStr = new Date().toDateString();

      const stats = {
        totalLogs: logs.length,
        todayLogs: logs.filter(log => new Date(log.timestamp).toDateString() === todayStr).length,
        actionCounts: {},
        userCounts: {}
      };

      logs.forEach(log => {
        // Count actions
        stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;

        // Count user activities
        const username = log.userId?.username || 'Unknown';
        stats.userCounts[username] = (stats.userCounts[username] || 0) + 1;
      });

      res.json(stats);
    } catch (error) {
      console.error('Get log stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
