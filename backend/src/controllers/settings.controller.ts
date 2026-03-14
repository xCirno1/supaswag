import { Request, Response } from 'express';
import { pool } from '../db';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM settings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      // Return defaults if no row yet
      return res.status(200).json({
        id: 1,
        weight_unit: 'g',
        energy_unit: 'kcal',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { weight_unit, energy_unit } = req.body;

    const allowed_weight = ['g', 'kg', 'oz', 'lb'];
    const allowed_energy = ['kcal', 'kJ'];

    if (weight_unit && !allowed_weight.includes(weight_unit)) {
      return res.status(400).json({ error: `weight_unit must be one of: ${allowed_weight.join(', ')}` });
    }
    if (energy_unit && !allowed_energy.includes(energy_unit)) {
      return res.status(400).json({ error: `energy_unit must be one of: ${allowed_energy.join(', ')}` });
    }

    // Upsert/insert row if missing, update if present
    const result = await pool.query(
      `INSERT INTO settings (id, weight_unit, energy_unit)
       VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE
         SET weight_unit = COALESCE(EXCLUDED.weight_unit, settings.weight_unit),
             energy_unit = COALESCE(EXCLUDED.energy_unit, settings.energy_unit),
             updated_at  = NOW()
       RETURNING *`,
      [weight_unit ?? 'g', energy_unit ?? 'kcal']
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};