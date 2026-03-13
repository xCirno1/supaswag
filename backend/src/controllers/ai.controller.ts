import { Request, Response } from 'express';
import { pool } from '../db';
import { analyzeDiet } from '../utils/ai-engine';

export const getPatientAnalysis = async (req: Request, res: Response) => {
  try {
    const patientRes = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (patientRes.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const inventoryRes = await pool.query('SELECT * FROM inventory');

    const analysis = await analyzeDiet(patientRes.rows[0], inventoryRes.rows);
    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getBulkInventoryNeeds = async (req: Request, res: Response) => {
  try {
    const patientsRes = await pool.query('SELECT * FROM patients');
    const inventoryRes = await pool.query('SELECT * FROM inventory ORDER BY id ASC');

    const patients = patientsRes.rows;
    let inventory = inventoryRes.rows.map(item => ({ ...item, requested: 0, blockedCount: 0 }));

    for (const patient of patients) {
      const analysis = await analyzeDiet(patient, inventoryRes.rows);

      analysis.safeFoods.forEach(safeItem => {
        const idx = inventory.findIndex(n => n.id === safeItem.id);
        if (idx > -1) inventory[idx].requested += 1;
      });

      analysis.flaggedFoods.forEach(flagged => {
        const idx = inventory.findIndex(n => n.id === flagged.item.id);
        if (idx > -1) inventory[idx].blockedCount += 1;
      });
    }

    const needsAnalysis = inventory.map(item => ({
      ...item,
      status: item.stock < item.requested * 7 ? 'ORDER NOW' : 'SUFFICIENT',
      aiInsight: item.blockedCount > (patients.length / 2)
        ? `Warning: ${item.blockedCount} patients cannot eat this due to EHR conflicts. Reduce bulk order.`
        : 'Approved for general population.'
    }));

    res.status(200).json(needsAnalysis);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getMealPlans = async (req: Request, res: Response) => {
  // Can be used to serve the pre-calculated meal-plan page data directly
  try {
    const patientsRes = await pool.query('SELECT * FROM patients');
    const inventoryRes = await pool.query('SELECT * FROM inventory');
    const mealPlans = [];
    for (const patient of patientsRes.rows) {
      const analysis = await analyzeDiet(patient, inventoryRes.rows);

      const proteins = analysis.safeFoods.filter(f => f.name.includes('Salmon') || f.name.includes('Cheese') || f.name.includes('Peanut'));
      const sides = analysis.safeFoods.filter(f => f.name.includes('Rice') || f.name.includes('Spinach') || f.name.includes('Bread'));

      mealPlans.push({
        patient: { id: patient.id, name: patient.name, room: patient.room },
        protein: proteins[0]?.name || 'Standard Protein',
        side: sides[0]?.name || 'Standard Side',
        flags: analysis.flaggedFoods
      });
    }

    res.status(200).json(mealPlans);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getAiLogs = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT 10');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};