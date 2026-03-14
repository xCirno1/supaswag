import { Request, Response } from 'express';
import { pool } from '../db';
import { cache } from '../utils/cache';

export const getAllPatients = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY priority DESC, id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const addPatient = async (req: Request, res: Response) => {
  try {
    const {
      name, age, room, conditions, medications, allergies, priority,
      height_cm, weight_kg,
    } = req.body;

    const idResult = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)) as max_id FROM patients"
    );
    const nextNum = (idResult.rows[0].max_id || 0) + 1;
    const newId = `P${String(nextNum).padStart(3, '0')}`;

    const insertResult = await pool.query(
      `INSERT INTO patients
         (id, name, age, room, conditions, medications, allergies, priority, height_cm, weight_kg)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        newId, name, age, room,
        conditions || ['New Patient Admission'],
        medications || ['None'],
        allergies || ['None'],
        priority ?? 0,
        height_cm != null ? parseFloat(height_cm) : null,
        weight_kg != null ? parseFloat(weight_kg) : null,
      ]
    );

    cache.invalidate('analysis:');
    console.log('[Cache BUST] New patient admitted — all analysis caches cleared');

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const removePatient = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = $1', [req.params.id]);

    cache.invalidate('analysis:');
    console.log(`[Cache BUST] Patient ${req.params.id} discharged — all analysis caches cleared`);

    res.status(200).json({ message: 'Patient removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const updatePatientPriority = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (typeof priority !== 'number' || priority < 0 || priority > 3) {
      return res.status(400).json({ error: 'Priority must be 0–3' });
    }

    const result = await pool.query(
      'UPDATE patients SET priority = $1 WHERE id = $2 RETURNING *',
      [priority, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });

    cache.invalidate('analysis:meal-plans');
    cache.invalidate(`analysis:patient:${id}`);
    console.log(`[Cache BUST] Patient ${id} priority updated`);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

// PATCH /patients/:id/bmi  — update height/weight, bust patient + meal-plan cache
export const updatePatientBMI = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { height_cm, weight_kg } = req.body;

    if (height_cm != null && (isNaN(Number(height_cm)) || Number(height_cm) <= 0)) {
      return res.status(400).json({ error: 'height_cm must be a positive number' });
    }
    if (weight_kg != null && (isNaN(Number(weight_kg)) || Number(weight_kg) <= 0)) {
      return res.status(400).json({ error: 'weight_kg must be a positive number' });
    }

    const result = await pool.query(
      `UPDATE patients
          SET height_cm = COALESCE($1, height_cm),
              weight_kg = COALESCE($2, weight_kg)
        WHERE id = $3
        RETURNING *`,
      [
        height_cm != null ? parseFloat(height_cm) : null,
        weight_kg != null ? parseFloat(weight_kg) : null,
        id,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });

    // BMI change invalidates per-patient analysis AND meal plans
    cache.invalidate(`analysis:patient:${id}`);
    cache.invalidate('analysis:meal-plans');
    console.log(`[Cache BUST] Patient ${id} BMI data updated`);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};