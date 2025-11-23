const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'restaurant.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT UNIQUE NOT NULL,
    qr_code TEXT,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    total_amount REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`);

// Insert sample data
const insertCategory = db.prepare('INSERT OR IGNORE INTO menu_categories (name, display_order) VALUES (?, ?)');
const insertMenuItem = db.prepare('INSERT OR IGNORE INTO menu_items (category_id, name, description, price, available) VALUES (?, ?, ?, ?, ?)');
const insertTable = db.prepare('INSERT OR IGNORE INTO tables (table_number, status) VALUES (?, ?)');

// Sample categories
insertCategory.run('Appetizers', 1);
insertCategory.run('Main Courses', 2);
insertCategory.run('Desserts', 3);
insertCategory.run('Beverages', 4);

// Sample menu items
insertMenuItem.run(1, 'Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 8.99, 1);
insertMenuItem.run(1, 'Garlic Bread', 'Toasted bread with garlic butter and herbs', 6.99, 1);
insertMenuItem.run(1, 'Chicken Wings', 'Spicy buffalo wings with ranch dressing', 12.99, 1);

insertMenuItem.run(2, 'Grilled Salmon', 'Fresh salmon with lemon butter sauce and vegetables', 24.99, 1);
insertMenuItem.run(2, 'Beef Burger', 'Angus beef burger with cheese, lettuce, and tomato', 16.99, 1);
insertMenuItem.run(2, 'Chicken Pasta', 'Creamy alfredo pasta with grilled chicken', 18.99, 1);
insertMenuItem.run(2, 'Margherita Pizza', 'Classic pizza with tomato, mozzarella, and basil', 14.99, 1);

insertMenuItem.run(3, 'Chocolate Cake', 'Rich chocolate cake with vanilla ice cream', 8.99, 1);
insertMenuItem.run(3, 'Cheesecake', 'New York style cheesecake with berry compote', 9.99, 1);
insertMenuItem.run(3, 'Ice Cream Sundae', 'Three scoops with your choice of toppings', 7.99, 1);

insertMenuItem.run(4, 'Coca Cola', 'Refreshing cola drink', 3.99, 1);
insertMenuItem.run(4, 'Fresh Orange Juice', 'Freshly squeezed orange juice', 5.99, 1);
insertMenuItem.run(4, 'Coffee', 'Freshly brewed coffee', 4.99, 1);
insertMenuItem.run(4, 'Iced Tea', 'Cold brewed iced tea', 3.99, 1);

// Sample tables
for (let i = 1; i <= 10; i++) {
  insertTable.run(`Table ${i}`, 'available');
}

console.log('Database initialized successfully!');
console.log('- Created tables schema');
console.log('- Added sample menu categories and items');
console.log('- Created 10 tables');

db.close();
