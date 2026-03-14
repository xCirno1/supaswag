import { Request, Response } from 'express';
import { pool } from '../db';
import { cache } from '../utils/cache';

export const getInventory = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const result = await pool.query(
      'UPDATE inventory SET stock = $1 WHERE id = $2 RETURNING *',
      [stock, id]
    );

    cache.invalidate('analysis:inventory-needs');
    cache.invalidate('analysis:meal-plans');
    console.log(`[Cache BUST] Inventory ${id} updated — inventory-needs & meal-plans caches cleared`);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    const { name, unit, stock, tags } = req.body;

    if (!name || !unit || stock === undefined) {
      return res.status(400).json({ error: 'name, unit, and stock are required' });
    }

    // Use a single atomic INSERT that computes the next ID in one statement,
    // avoiding the read-then-write race when multiple items are inserted concurrently.
    const result = await pool.query(
      `INSERT INTO inventory (id, name, unit, stock, tags)
       SELECT
         'I' || LPAD((COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)), 0) + 1)::TEXT, 3, '0'),
         $1, $2, $3, $4
       FROM inventory
       RETURNING *`,
      [name, unit, stock ?? 0, tags ?? []]
    );

    cache.invalidate('analysis:inventory-needs');
    cache.invalidate('analysis:meal-plans');
    console.log(`[Cache BUST] New inventory item added: ${result.rows[0].id}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};