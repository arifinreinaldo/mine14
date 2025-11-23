const request = require('supertest');
const express = require('express');
const Database = require('better-sqlite3');
const { setupTestDB, cleanupTestDB } = require('../setup');
const { Server } = require('socket.io');
const { createServer } = require('http');

// Mock the database module
jest.mock('../../src/db/database', () => {
  const Database = require('better-sqlite3');
  const path = require('path');
  const db = new Database(path.join(__dirname, '../data-test/test.db'));
  db.pragma('foreign_keys = ON');
  return db;
});

const ordersRouter = require('../../src/routes/orders');

describe('Orders API', () => {
  let app;
  let db;
  let httpServer;
  let io;

  beforeAll(() => {
    const dbPath = setupTestDB();
    db = new Database(dbPath);

    app = express();
    httpServer = createServer(app);
    io = new Server(httpServer);

    app.use(express.json());
    app.set('io', io);
    app.use('/api/orders', ordersRouter);
  });

  afterAll(() => {
    db.close();
    cleanupTestDB();
    httpServer.close();
  });

  beforeEach(() => {
    // Clear data before each test
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM menu_items').run();
    db.prepare('DELETE FROM menu_categories').run();
    db.prepare('DELETE FROM tables').run();
  });

  describe('POST /api/orders', () => {
    test('should create a new order', async () => {
      // Setup test data
      const tableResult = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = tableResult.lastInsertRowid;

      const catResult = db.prepare('INSERT INTO menu_categories (name) VALUES (?)').run('Main Courses');
      const categoryId = catResult.lastInsertRowid;

      const itemResult = db.prepare('INSERT INTO menu_items (category_id, name, price) VALUES (?, ?, ?)').run(categoryId, 'Burger', 15.99);
      const itemId = itemResult.lastInsertRowid;

      const response = await request(app)
        .post('/api/orders')
        .send({
          table_id: tableId,
          items: [
            { menu_item_id: itemId, quantity: 2, notes: 'No onions' }
          ],
          notes: 'Rush order'
        });

      expect(response.status).toBe(200);
      expect(response.body.order_number).toBeDefined();
      expect(response.body.total_amount).toBe(31.98);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].quantity).toBe(2);
    });

    test('should fail with empty items array', async () => {
      const tableResult = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = tableResult.lastInsertRowid;

      const response = await request(app)
        .post('/api/orders')
        .send({
          table_id: tableId,
          items: []
        });

      expect(response.status).toBe(400);
    });

    test('should update table status to occupied', async () => {
      // Setup test data
      const tableResult = db.prepare('INSERT INTO tables (table_number, status) VALUES (?, ?)').run('Table 1', 'available');
      const tableId = tableResult.lastInsertRowid;

      const catResult = db.prepare('INSERT INTO menu_categories (name) VALUES (?)').run('Main Courses');
      const categoryId = catResult.lastInsertRowid;

      const itemResult = db.prepare('INSERT INTO menu_items (category_id, name, price) VALUES (?, ?, ?)').run(categoryId, 'Burger', 15.99);
      const itemId = itemResult.lastInsertRowid;

      await request(app)
        .post('/api/orders')
        .send({
          table_id: tableId,
          items: [{ menu_item_id: itemId, quantity: 1 }]
        });

      const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
      expect(table.status).toBe('occupied');
    });
  });

  describe('GET /api/orders', () => {
    test('should return all orders', async () => {
      // Setup test data
      const tableResult = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = tableResult.lastInsertRowid;

      const orderResult = db.prepare('INSERT INTO orders (table_id, order_number, status, total_amount) VALUES (?, ?, ?, ?)').run(tableId, 'ORD-001', 'pending', 25.99);

      const response = await request(app).get('/api/orders');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].order_number).toBe('ORD-001');
    });

    test('should filter orders by status', async () => {
      const tableResult = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = tableResult.lastInsertRowid;

      db.prepare('INSERT INTO orders (table_id, order_number, status, total_amount) VALUES (?, ?, ?, ?)').run(tableId, 'ORD-001', 'pending', 25.99);
      db.prepare('INSERT INTO orders (table_id, order_number, status, total_amount) VALUES (?, ?, ?, ?)').run(tableId, 'ORD-002', 'ready', 35.99);

      const response = await request(app).get('/api/orders?status=ready');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('ready');
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    test('should update order status', async () => {
      const tableResult = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = tableResult.lastInsertRowid;

      const orderResult = db.prepare('INSERT INTO orders (table_id, order_number, status, total_amount) VALUES (?, ?, ?, ?)').run(tableId, 'ORD-001', 'pending', 25.99);
      const orderId = orderResult.lastInsertRowid;

      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .send({ status: 'preparing' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('preparing');
    });

    test('should mark table as available when all orders completed', async () => {
      const tableResult = db.prepare('INSERT INTO tables (table_number, status) VALUES (?, ?)').run('Table 1', 'occupied');
      const tableId = tableResult.lastInsertRowid;

      const orderResult = db.prepare('INSERT INTO orders (table_id, order_number, status, total_amount) VALUES (?, ?, ?, ?)').run(tableId, 'ORD-001', 'ready', 25.99);
      const orderId = orderResult.lastInsertRowid;

      await request(app)
        .put(`/api/orders/${orderId}/status`)
        .send({ status: 'completed' });

      const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
      expect(table.status).toBe('available');
    });
  });

  describe('GET /api/orders/:id', () => {
    test('should return a specific order with items', async () => {
      // Setup test data
      const tableResult = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = tableResult.lastInsertRowid;

      const catResult = db.prepare('INSERT INTO menu_categories (name) VALUES (?)').run('Main Courses');
      const categoryId = catResult.lastInsertRowid;

      const itemResult = db.prepare('INSERT INTO menu_items (category_id, name, price) VALUES (?, ?, ?)').run(categoryId, 'Burger', 15.99);
      const menuItemId = itemResult.lastInsertRowid;

      const orderResult = db.prepare('INSERT INTO orders (table_id, order_number, status, total_amount) VALUES (?, ?, ?, ?)').run(tableId, 'ORD-001', 'pending', 15.99);
      const orderId = orderResult.lastInsertRowid;

      db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)').run(orderId, menuItemId, 1, 15.99);

      const response = await request(app).get(`/api/orders/${orderId}`);
      expect(response.status).toBe(200);
      expect(response.body.order_number).toBe('ORD-001');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe('Burger');
    });

    test('should return 404 for non-existent order', async () => {
      const response = await request(app).get('/api/orders/999');
      expect(response.status).toBe(404);
    });
  });
});
