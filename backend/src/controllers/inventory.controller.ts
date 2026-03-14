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

    // Inventory stock change affects ORDER NOW status in inventory-needs and meal plans
    cache.invalidate('analysis:inventory-needs');
    cache.invalidate('analysis:meal-plans');
    console.log(`[Cache BUST] Inventory ${id} updated — inventory-needs & meal-plans caches cleared`);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};