const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all categories with items
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT * FROM menu_categories
      ORDER BY display_order, name
    `).all();

    const categoriesWithItems = categories.map(category => {
      const items = db.prepare(`
        SELECT * FROM menu_items
        WHERE category_id = ? AND available = 1
        ORDER BY name
      `).all(category.id);

      return { ...category, items };
    });

    res.json(categoriesWithItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all menu items
router.get('/items', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      ORDER BY mc.display_order, mi.name
    `).all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single menu item
router.get('/items/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/categories', (req, res) => {
  try {
    const { name, display_order } = req.body;
    const insert = db.prepare('INSERT INTO menu_categories (name, display_order) VALUES (?, ?)');
    const result = insert.run(name, display_order || 0);
    const category = db.prepare('SELECT * FROM menu_categories WHERE id = ?').get(result.lastInsertRowid);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create menu item
router.post('/items', (req, res) => {
  try {
    const { category_id, name, description, price, image_url } = req.body;
    const insert = db.prepare(`
      INSERT INTO menu_items (category_id, name, description, price, image_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insert.run(category_id, name, description, price, image_url);
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update menu item
router.put('/items/:id', (req, res) => {
  try {
    const { category_id, name, description, price, image_url, available } = req.body;
    db.prepare(`
      UPDATE menu_items
      SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, available = ?
      WHERE id = ?
    `).run(category_id, name, description, price, image_url, available, req.params.id);

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle item availability
router.put('/items/:id/availability', (req, res) => {
  try {
    const { available } = req.body;
    db.prepare('UPDATE menu_items SET available = ? WHERE id = ?').run(available, req.params.id);
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete menu item
router.delete('/items/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/categories/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM menu_categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
