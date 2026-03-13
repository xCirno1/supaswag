import { Request, Response } from 'express';
import { pool } from '../db';

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
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};