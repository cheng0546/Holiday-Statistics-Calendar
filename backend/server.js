const path = require('path');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'holidays.db');

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const app = express();
app.use(cors());
app.use(express.json());

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

app.get('/api/holidays', (req, res) => {
  res.json(db.prepare('SELECT * FROM holidays ORDER BY start_date, id').all());
});

app.post('/api/holidays', (req, res) => {
  const { name, start_date, end_date } = req.body || {};
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed || trimmed.length > 50) {
    return res.status(400).json({ error: '姓名不能为空且不超过50个字符' });
  }
  if (!validDate(start_date) || !validDate(end_date)) {
    return res.status(400).json({ error: '日期格式必须为 YYYY-MM-DD' });
  }
  if (end_date < start_date) {
    return res.status(400).json({ error: '结束日期不能早于开始日期' });
  }
  const info = db
    .prepare('INSERT INTO holidays (name, start_date, end_date) VALUES (?, ?, ?)')
    .run(trimmed, start_date, end_date);
  res.status(201).json(db.prepare('SELECT * FROM holidays WHERE id = ?').get(info.lastInsertRowid));
});

app.delete('/api/holidays/:id', (req, res) => {
  const info = db.prepare('DELETE FROM holidays WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: '记录不存在' });
  res.json({ success: true });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
