import { Request, Response } from 'express';
import { pool } from '../db';

export const getMedications = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT name FROM medications ORDER BY name ASC');
    res.status(200).json(result.rows.map(row => row.name));
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const addMedication = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    await pool.query('INSERT INTO medications (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
    res.status(201).json({ name });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getAllergies = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT name FROM allergies ORDER BY name ASC');
    res.status(200).json(result.rows.map(row => row.name));
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const addAllergy = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    await pool.query('INSERT INTO allergies (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
    res.status(201).json({ name });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};