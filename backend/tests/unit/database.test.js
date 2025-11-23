const Database = require('better-sqlite3');
const { setupTestDB, cleanupTestDB } = require('../setup');
const path = require('path');

describe('Database Schema', () => {
  let db;

  beforeAll(() => {
    const dbPath = setupTestDB();
    db = new Database(dbPath);
  });

  afterAll(() => {
    db.close();
    cleanupTestDB();
  });

  test('should create tables table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tables'").get();
    expect(result).toBeDefined();
    expect(result.name).toBe('tables');
  });

  test('should create menu_categories table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='menu_categories'").get();
    expect(result).toBeDefined();
    expect(result.name).toBe('menu_categories');
  });

  test('should create menu_items table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='menu_items'").get();
    expect(result).toBeDefined();
    expect(result.name).toBe('menu_items');
  });

  test('should create orders table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'").get();
    expect(result).toBeDefined();
    expect(result.name).toBe('orders');
  });

  test('should create order_items table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='order_items'").get();
    expect(result).toBeDefined();
    expect(result.name).toBe('order_items');
  });

  test('should insert and retrieve a table', () => {
    const insert = db.prepare('INSERT INTO tables (table_number) VALUES (?)');
    const result = insert.run('Test Table 1');
    expect(result.lastInsertRowid).toBeDefined();

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(result.lastInsertRowid);
    expect(table.table_number).toBe('Test Table 1');
    expect(table.status).toBe('available');
  });

  test('should enforce foreign key constraints', () => {
    expect(() => {
      db.prepare('INSERT INTO menu_items (category_id, name, price) VALUES (?, ?, ?)').run(999, 'Test Item', 10.99);
    }).toThrow();
  });
});
