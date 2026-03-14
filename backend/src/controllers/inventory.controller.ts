import { Request, Response } from 'express';
import { pool } from '../db';
import { cache } from '../utils/cache';
import { normaliseUnit, toSIStock, isValidSIUnit } from '../utils/units';

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

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'stock must be a non-negative number' });
    }

    // Stock is always stored in SI, the frontend sends SI values directly.
    const result = await pool.query(
      'UPDATE inventory SET stock = $1 WHERE id = $2 RETURNING *',
      [Math.round(stock), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

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
    const { name, unit, stock, tags, inputUnit } = req.body;

    if (!name || !unit || stock === undefined) {
      return res.status(400).json({ error: 'name, unit, and stock are required' });
    }

    const siUnit = normaliseUnit(unit);

    const rawInputUnit = inputUnit ?? unit;
    const siStock = toSIStock(Number(stock), rawInputUnit);

    if (!isValidSIUnit(siUnit)) {
      // Should never happen given normaliseUnit's fallback, but belt-and-braces.
      return res.status(400).json({ error: `unit must be one of: g, ml, pcs` });
    }

    const result = await pool.query(
      `INSERT INTO inventory (id, name, unit, stock, tags)
       SELECT
         'I' || LPAD((COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)), 0) + 1)::TEXT, 3, '0'),
         $1, $2, $3, $4
       FROM inventory
       RETURNING *`,
      [name, siUnit, siStock, tags ?? []]
    );

    cache.invalidate('analysis:inventory-needs');
    cache.invalidate('analysis:meal-plans');
    console.log(`[Cache BUST] New inventory item added: ${result.rows[0].id} (${siStock} ${siUnit})`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};