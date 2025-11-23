const request = require('supertest');
const express = require('express');
const Database = require('better-sqlite3');
const { setupTestDB, cleanupTestDB, testDbDir } = require('../setup');
const path = require('path');

// Mock the database module
jest.mock('../../src/db/database', () => {
  const Database = require('better-sqlite3');
  const path = require('path');
  const db = new Database(path.join(__dirname, '../data-test/test.db'));
  db.pragma('foreign_keys = ON');
  return db;
});

const tablesRouter = require('../../src/routes/tables');

describe('Tables API', () => {
  let app;
  let db;

  beforeAll(() => {
    const dbPath = setupTestDB();
    db = new Database(dbPath);

    app = express();
    app.use(express.json());
    app.use('/api/tables', tablesRouter);
  });

  afterAll(() => {
    db.close();
    cleanupTestDB();
  });

  beforeEach(() => {
    // Clear tables before each test
    db.prepare('DELETE FROM tables').run();
  });

  describe('GET /api/tables', () => {
    test('should return empty array when no tables exist', async () => {
      const response = await request(app).get('/api/tables');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all tables', async () => {
      // Insert test tables
      db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 2');

      const response = await request(app).get('/api/tables');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].table_number).toBe('Table 1');
    });
  });

  describe('GET /api/tables/:id', () => {
    test('should return a specific table', async () => {
      const result = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = result.lastInsertRowid;

      const response = await request(app).get(`/api/tables/${tableId}`);
      expect(response.status).toBe(200);
      expect(response.body.table_number).toBe('Table 1');
    });

    test('should return 404 for non-existent table', async () => {
      const response = await request(app).get('/api/tables/999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tables', () => {
    test('should create a new table', async () => {
      const response = await request(app)
        .post('/api/tables')
        .send({ table_number: 'Table 5' });

      expect(response.status).toBe(200);
      expect(response.body.table_number).toBe('Table 5');
      expect(response.body.id).toBeDefined();
    });

    test('should not create duplicate table numbers', async () => {
      await request(app)
        .post('/api/tables')
        .send({ table_number: 'Table 1' });

      const response = await request(app)
        .post('/api/tables')
        .send({ table_number: 'Table 1' });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/tables/:id/status', () => {
    test('should update table status', async () => {
      const result = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = result.lastInsertRowid;

      const response = await request(app)
        .put(`/api/tables/${tableId}/status`)
        .send({ status: 'occupied' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('occupied');
    });
  });

  describe('DELETE /api/tables/:id', () => {
    test('should delete a table', async () => {
      const result = db.prepare('INSERT INTO tables (table_number) VALUES (?)').run('Table 1');
      const tableId = result.lastInsertRowid;

      const response = await request(app).delete(`/api/tables/${tableId}`);
      expect(response.status).toBe(200);

      // Verify table is deleted
      const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
      expect(table).toBeUndefined();
    });
  });
});
