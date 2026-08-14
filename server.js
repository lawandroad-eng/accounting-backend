const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/accounting_db'
});

app.get('/api/invoices', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.post('/api/invoices', async (req, res) => {
  const { name, amount } = req.body;
  if (!name || !amount) {
    return res.status(400).json({ error: 'Name and amount are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO invoices (name, amount) VALUES ($1, $2) RETURNING *',
      [name, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add invoice' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const { name, amount } = req.body;
  if (!name || !amount) {
    return res.status(400).json({ error: 'Name and amount are required' });
  }
  try {
    const result = await pool.query(
      'UPDATE invoices SET name = $1, amount = $2 WHERE id = $3 RETURNING *',
      [name, amount, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted', invoice: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
