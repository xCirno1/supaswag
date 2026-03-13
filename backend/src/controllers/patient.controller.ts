import { Request, Response } from 'express';
import { pool } from '../db';

export const getAllPatients = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY id ASC');
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
    const { name, age, room, conditions, medications, allergies } = req.body;

    // Generate next PXXX ID
    const idResult = await pool.query("SELECT MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)) as max_id FROM patients");
    const nextNum = (idResult.rows[0].max_id || 0) + 1;
    const newId = `P${String(nextNum).padStart(3, '0')}`;

    const insertResult = await pool.query(
      `INSERT INTO patients (id, name, age, room, conditions, medications, allergies) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [newId, name, age, room, conditions || ['New Patient Admission'], medications || ['None'], allergies || ['None']]
    );
    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const removePatient = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'Patient removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};