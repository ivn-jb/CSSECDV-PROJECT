module.exports = (app, { authenticateToken, requireRole, logActivity, Order, Cookie }) => {

  // Get orders (role-based)
  app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
      let orders;
      if (req.user.role === 'customer') {
        orders = await Order.find({ customerId: req.user.id });
      } else {
        orders = await Order.find();
      }
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create order (Customer only)
  app.post('/api/orders', authenticateToken, requireRole(['customer']), async (req, res) => {
    try {
      const { items, shippingAddress } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item' });
      }
      if (!shippingAddress) {
        return res.status(400).json({ error: 'Shipping address is required' });
      }

      let totalAmount = 0;
      const orderItems = [];

      // Validate items and calculate total
      for (const item of items) {
        const cookie = await Cookie.findById(item.cookieId);
        if (!cookie) {
          return res.status(400).json({ error: `Cookie with ID ${item.cookieId} not found` });
        }
        if (cookie.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${cookie.name}` });
        }
        const itemTotal = cookie.price * item.quantity;
        totalAmount += itemTotal;
        orderItems.push({
          cookieId: cookie._id,
          cookieName: cookie.name,
          price: cookie.price,
          quantity: item.quantity,
          subtotal: itemTotal
        });
      }

      // Update cookie stock
      for (const item of items) {
        await Cookie.findByIdAndUpdate(item.cookieId, { $inc: { stock: -item.quantity } });
      }

      const newOrder = new Order({
        customerId: req.user.id,
        customerName: req.user.username,
        items: orderItems,
        totalAmount,
        shippingAddress,
        status: 'pending',
        createdAt: new Date()
      });

      await newOrder.save();
      await logActivity(req.user.id, 'CREATE_ORDER', `Created order #${newOrder._id} for ₱${totalAmount.toFixed(2)}`);

      res.json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update order status (Manager/Admin only)
  app.put('/api/orders/:id/status', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      order.status = status;
      order.updatedAt = new Date();
      await order.save();

      await logActivity(req.user.id, 'UPDATE_ORDER_STATUS', `Updated order #${order._id} status to ${status}`);

      res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Cancel order (Customer can cancel their own orders, Manager/Admin can cancel any)
  app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check permissions
      if (req.user.role === 'customer' && order.customerId != req.user.id) {
        return res.status(403).json({ error: 'You can only cancel your own orders' });
      }

      // Can only cancel pending or processing orders
      if (!['pending', 'processing'].includes(order.status)) {
        return res.status(400).json({ error: 'Cannot cancel order in current status' });
      }

      // Restore cookie stock
      for (const item of order.items) {
        await Cookie.findByIdAndUpdate(item.cookieId, { $inc: { stock: item.quantity } });
      }

      order.status = 'cancelled';
      order.updatedAt = new Date();
      await order.save();

      await logActivity(req.user.id, 'CANCEL_ORDER', `Cancelled order #${order._id}`);

      res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
