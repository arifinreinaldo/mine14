const express = require('express');
const router = express.Router();
const db = require('../db/database');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const qrCodeDir = path.join(__dirname, '../../qrcodes');
if (!fs.existsSync(qrCodeDir)) {
  fs.mkdirSync(qrCodeDir, { recursive: true });
}

// Get all tables
router.get('/', (req, res) => {
  try {
    const tables = db.prepare('SELECT * FROM tables ORDER BY table_number').all();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single table
router.get('/:id', (req, res) => {
  try {
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create table
router.post('/', async (req, res) => {
  try {
    const { table_number } = req.body;

    const insert = db.prepare('INSERT INTO tables (table_number) VALUES (?)');
    const result = insert.run(table_number);

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(result.lastInsertRowid);

    // Generate QR code
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const orderUrl = `${baseUrl.replace(':3000', ':5173')}/order/${table.id}`;
    const qrCodePath = `/qrcodes/table-${table.id}.png`;

    await QRCode.toFile(path.join(qrCodeDir, `table-${table.id}.png`), orderUrl);

    db.prepare('UPDATE tables SET qr_code = ? WHERE id = ?').run(qrCodePath, table.id);
    table.qr_code = qrCodePath;

    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate QR codes for all tables
router.post('/generate-qr', async (req, res) => {
  try {
    const tables = db.prepare('SELECT * FROM tables').all();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    for (const table of tables) {
      const orderUrl = `${baseUrl.replace(':3000', ':5173')}/order/${table.id}`;
      const qrCodePath = `/qrcodes/table-${table.id}.png`;

      await QRCode.toFile(path.join(qrCodeDir, `table-${table.id}.png`), orderUrl);
      db.prepare('UPDATE tables SET qr_code = ? WHERE id = ?').run(qrCodePath, table.id);
    }

    res.json({ message: 'QR codes generated successfully', count: tables.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update table status
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(status, req.params.id);
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id);
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete table
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tables WHERE id = ?').run(req.params.id);

    // Delete QR code file
    const qrCodeFile = path.join(qrCodeDir, `table-${req.params.id}.png`);
    if (fs.existsSync(qrCodeFile)) {
      fs.unlinkSync(qrCodeFile);
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
