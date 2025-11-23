const request = require('supertest');
const express = require('express');
const Database = require('better-sqlite3');
const { setupTestDB, cleanupTestDB } = require('../setup');
const path = require('path');

// Mock the database module
jest.mock('../../src/db/database', () => {
  const Database = require('better-sqlite3');
  const path = require('path');
  const db = new Database(path.join(__dirname, '../data-test/test.db'));
  db.pragma('foreign_keys = ON');
  return db;
});

const menuRouter = require('../../src/routes/menu');

describe('Menu API', () => {
  let app;
  let db;

  beforeAll(() => {
    const dbPath = setupTestDB();
    db = new Database(dbPath);

    app = express();
    app.use(express.json());
    app.use('/api/menu', menuRouter);
  });

  afterAll(() => {
    db.close();
    cleanupTestDB();
  });

  beforeEach(() => {
    // Clear data before each test
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM menu_items').run();
    db.prepare('DELETE FROM menu_categories').run();
  });

  describe('GET /api/menu/categories', () => {
    test('should return empty array when no categories exist', async () => {
      const response = await request(app).get('/api/menu/categories');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return categories with items', async () => {
      // Insert category
      const catResult = db.prepare('INSERT INTO menu_categories (name, display_order) VALUES (?, ?)').run('Appetizers', 1);
      const categoryId = catResult.lastInsertRowid;

      // Insert menu item
      db.prepare('INSERT INTO menu_items (category_id, name, price, available) VALUES (?, ?, ?, ?)').run(categoryId, 'Spring Rolls', 8.99, 1);

      const response = await request(app).get('/api/menu/categories');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Appetizers');
      expect(response.body[0].items).toHaveLength(1);
      expect(response.body[0].items[0].name).toBe('Spring Rolls');
    });
  });

  describe('POST /api/menu/categories', () => {
    test('should create a new category', async () => {
      const response = await request(app)
        .post('/api/menu/categories')
        .send({ name: 'Desserts', display_order: 3 });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Desserts');
      expect(response.body.display_order).toBe(3);
    });
  });

  describe('POST /api/menu/items', () => {
    test('should create a new menu item', async () => {
      // Create category first
      const catResult = db.prepare('INSERT INTO menu_categories (name) VALUES (?)').run('Main Courses');
      const categoryId = catResult.lastInsertRowid;

      const response = await request(app)
        .post('/api/menu/items')
        .send({
          category_id: categoryId,
          name: 'Burger',
          description: 'Delicious burger',
          price: 15.99
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Burger');
      expect(response.body.price).toBe(15.99);
    });

    test('should fail with invalid category_id', async () => {
      const response = await request(app)
        .post('/api/menu/items')
        .send({
          category_id: 999,
          name: 'Test Item',
          price: 10.00
        });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/menu/items/:id/availability', () => {
    test('should toggle item availability', async () => {
      // Create category and item
      const catResult = db.prepare('INSERT INTO menu_categories (name) VALUES (?)').run('Beverages');
      const categoryId = catResult.lastInsertRowid;
      const itemResult = db.prepare('INSERT INTO menu_items (category_id, name, price, available) VALUES (?, ?, ?, ?)').run(categoryId, 'Coffee', 4.99, 1);
      const itemId = itemResult.lastInsertRowid;

      const response = await request(app)
        .put(`/api/menu/items/${itemId}/availability`)
        .send({ available: 0 });

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(0);
    });
  });

  describe('DELETE /api/menu/items/:id', () => {
    test('should delete a menu item', async () => {
      // Create category and item
      const catResult = db.prepare('INSERT INTO menu_categories (name) VALUES (?)').run('Desserts');
      const categoryId = catResult.lastInsertRowid;
      const itemResult = db.prepare('INSERT INTO menu_items (category_id, name, price) VALUES (?, ?, ?)').run(categoryId, 'Ice Cream', 5.99);
      const itemId = itemResult.lastInsertRowid;

      const response = await request(app).delete(`/api/menu/items/${itemId}`);
      expect(response.status).toBe(200);

      // Verify deletion
      const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(itemId);
      expect(item).toBeUndefined();
    });
  });
});
