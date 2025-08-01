module.exports = (app, { Cookie, authenticateToken, requireRole, upload, logActivity }) => {
  
  // Get all cookies
  app.get('/api/cookies', async (req, res) => {
  try {
    const cookies = await Cookie.find();
    res.json(cookies);
  } catch (error) {
    console.error('Get cookies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  });

  // Get single cookie
  app.get('/api/cookies/:id', async (req, res) => {
  try {
    const cookie = await Cookie.findById(req.params.id);
    if (!cookie) {
    return res.status(404).json({ error: 'Cookie not found' });
    }
    res.json(cookie);
  } catch (error) {
    console.error('Get cookie error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  });

  // Add new cookie (Manager/Admin only)
  app.post('/api/cookies', authenticateToken, requireRole(['admin', 'manager']), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    if (!name || !description || !price) {
    return res.status(400).json({ error: 'Name, description, and price are required' });
    }

    const newCookie = new Cookie({
    name,
    description,
    price: parseFloat(price),
    stock: parseInt(stock) || 0,
    image: req.file ? `/uploads/${req.file.filename}` : '/images/default-cookie.jpg',
    createdAt: new Date()
    });

    await newCookie.save();
    await logActivity(req.user.id, 'CREATE_COOKIE', `Created cookie: ${name}`);

    res.json({ message: 'Cookie added successfully', cookie: newCookie });
  } catch (error) {
    console.error('Add cookie error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  });

  // Update cookie (Manager/Admin only)
  app.put('/api/cookies/:id', authenticateToken, requireRole(['admin', 'manager']), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const updateFields = {
    updatedAt: new Date()
    };
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (price) updateFields.price = parseFloat(price);
    if (stock) updateFields.stock = parseInt(stock);
    if (req.file) updateFields.image = `/uploads/${req.file.filename}`;

    const updatedCookie = await Cookie.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true }
    );

    if (!updatedCookie) {
    return res.status(404).json({ error: 'Cookie not found' });
    }

    await logActivity(req.user.id, 'UPDATE_COOKIE', `Updated cookie: ${updatedCookie.name}`);

    res.json({ message: 'Cookie updated successfully', cookie: updatedCookie });
  } catch (error) {
    console.error('Update cookie error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  });

  // Delete cookie (Manager/Admin only)
  app.delete('/api/cookies/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const deletedCookie = await Cookie.findByIdAndDelete(req.params.id);
    if (!deletedCookie) {
    return res.status(404).json({ error: 'Cookie not found' });
    }

    await logActivity(req.user.id, 'DELETE_COOKIE', `Deleted cookie: ${deletedCookie.name}`);

    res.json({ message: 'Cookie deleted successfully' });
  } catch (error) {
    console.error('Delete cookie error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  });
};
