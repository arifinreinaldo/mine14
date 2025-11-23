const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Get all orders
router.get('/', (req, res) => {
  try {
    const { status, table_id } = req.query;
    let query = `
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
    `;
    const params = [];

    if (status || table_id) {
      query += ' WHERE';
      if (status) {
        query += ' o.status = ?';
        params.push(status);
      }
      if (table_id) {
        if (status) query += ' AND';
        query += ' o.table_id = ?';
        params.push(table_id);
      }
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);

    // Get order items for each order
    const ordersWithItems = orders.map(order => {
      const items = db.prepare(`
        SELECT oi.*, mi.name, mi.description
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `).all(order.id);

      return { ...order, items };
    });

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare(`
      SELECT oi.*, mi.name, mi.description
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(order.id);

    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
router.post('/', (req, res) => {
  try {
    const { table_id, items, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Start transaction
    const createOrder = db.transaction(() => {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Calculate total
      let totalAmount = 0;
      items.forEach(item => {
        const menuItem = db.prepare('SELECT price FROM menu_items WHERE id = ?').get(item.menu_item_id);
        totalAmount += menuItem.price * item.quantity;
      });

      // Insert order
      const insertOrder = db.prepare(`
        INSERT INTO orders (table_id, order_number, total_amount, notes, status)
        VALUES (?, ?, ?, ?, 'pending')
      `);
      const orderResult = insertOrder.run(table_id, orderNumber, totalAmount, notes);
      const orderId = orderResult.lastInsertRowid;

      // Insert order items
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      items.forEach(item => {
        const menuItem = db.prepare('SELECT price FROM menu_items WHERE id = ?').get(item.menu_item_id);
        insertItem.run(orderId, item.menu_item_id, item.quantity, menuItem.price, item.notes);
      });

      // Update table status
      db.prepare('UPDATE tables SET status = ? WHERE id = ?').run('occupied', table_id);

      return orderId;
    });

    const orderId = createOrder();

    // Get created order with items
    const order = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.id = ?
    `).get(orderId);

    const orderItems = db.prepare(`
      SELECT oi.*, mi.name, mi.description
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(orderId);

    const fullOrder = { ...order, items: orderItems };

    // Emit to kitchen via Socket.IO
    const io = req.app.get('io');
    io.to('kitchen').emit('new-order', fullOrder);

    res.json(fullOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;

    db.prepare(`
      UPDATE orders
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.params.id);

    const order = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.id = ?
    `).get(req.params.id);

    const items = db.prepare(`
      SELECT oi.*, mi.name, mi.description
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(order.id);

    const fullOrder = { ...order, items };

    // Emit to server dashboard via Socket.IO
    const io = req.app.get('io');

    if (status === 'ready') {
      io.to('server').emit('order-ready', fullOrder);
    } else if (status === 'completed') {
      io.to('server').emit('order-completed', fullOrder);

      // Check if table has any more pending/ready orders
      const remainingOrders = db.prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE table_id = ? AND status IN ('pending', 'preparing', 'ready')
      `).get(order.table_id);

      if (remainingOrders.count === 0) {
        db.prepare('UPDATE tables SET status = ? WHERE id = ?').run('available', order.table_id);
      }
    }

    io.to('kitchen').emit('order-updated', fullOrder);

    res.json(fullOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
