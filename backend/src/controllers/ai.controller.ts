import { Request, Response } from 'express';
import { pool } from '../db';
import { analyzeDietBatch } from '../utils/ai-engine';
import { cache } from '../utils/cache';

// Cache key constants
const CACHE_KEY_INVENTORY_NEEDS = 'analysis:inventory-needs';
const CACHE_KEY_MEAL_PLANS = 'analysis:meal-plans';
const cacheKeyPatient = (id: string) => `analysis:patient:${id}`;

export const getPatientAnalysis = async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = cacheKeyPatient(id);

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] ${cacheKey}`);
    return res.status(200).json(cached);
  }
  console.log(`[Cache MISS] ${cacheKey}`);

  try {
    const patientRes = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (patientRes.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const inventoryRes = await pool.query('SELECT * FROM inventory');
    const [analysis] = await analyzeDietBatch([patientRes.rows[0]], inventoryRes.rows);

    cache.set(cacheKey, analysis);
    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
};

export const getBulkInventoryNeeds = async (req: Request, res: Response) => {
  // Check cache first
  const cached = cache.get(CACHE_KEY_INVENTORY_NEEDS);
  if (cached) {
    console.log(`[Cache HIT] ${CACHE_KEY_INVENTORY_NEEDS}`);
    return res.status(200).json(cached);
  }
  console.log(`[Cache MISS] ${CACHE_KEY_INVENTORY_NEEDS}`);

  try {
    const [patientsRes, inventoryRes] = await Promise.all([
      pool.query('SELECT * FROM patients'),
      pool.query('SELECT * FROM inventory ORDER BY id ASC'),
    ]);

    const patients = patientsRes.rows;
    const rawInventory = inventoryRes.rows;

    const analyses = await analyzeDietBatch(patients, rawInventory);

    const inventory = rawInventory.map(item => ({ ...item, requested: 0, blockedCount: 0 }));

    for (const analysis of analyses) {
      analysis.safeFoods.forEach(safeItem => {
        const idx = inventory.findIndex(n => n.id === safeItem.id);
        if (idx > -1) inventory[idx].requested += 1;
      });
      analysis.flaggedFoods.forEach(({ item }) => {
        const idx = inventory.findIndex(n => n.id === item.id);
        if (idx > -1) inventory[idx].blockedCount += 1;
      });
    }

    const needsAnalysis = inventory.map(item => ({
      ...item,
      status: item.stock < item.requested * 7 ? 'ORDER NOW' : 'SUFFICIENT',
      aiInsight: item.blockedCount > patients.length * 0.1
        ? `Warning: ${item.blockedCount} patients cannot eat this due to EHR conflicts. Reduce bulk order.`
        : 'Approved for general population.',
    }));

    cache.set(CACHE_KEY_INVENTORY_NEEDS, needsAnalysis);
    res.status(200).json(needsAnalysis);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
};

export const getMealPlans = async (req: Request, res: Response) => {
  // Check cache first
  const cached = cache.get(CACHE_KEY_MEAL_PLANS);
  if (cached) {
    console.log(`[Cache HIT] ${CACHE_KEY_MEAL_PLANS}`);
    return res.status(200).json(cached);
  }
  console.log(`[Cache MISS] ${CACHE_KEY_MEAL_PLANS}`);

  try {
    const [patientsRes, inventoryRes] = await Promise.all([
      pool.query('SELECT * FROM patients'),
      pool.query('SELECT * FROM inventory'),
    ]);

    // Single API call for all patients
    const analyses = await analyzeDietBatch(patientsRes.rows, inventoryRes.rows);

    const mealPlans = analyses.map(({ patient, safeFoods, flaggedFoods }) => {
      const proteins = safeFoods.filter(f =>
        ['Salmon', 'Cheese', 'Peanut'].some(k => f.name.includes(k))
      );
      const sides = safeFoods.filter(f =>
        ['Rice', 'Spinach', 'Bread'].some(k => f.name.includes(k))
      );

      return {
        patient: { id: patient.id, name: patient.name, room: patient.room },
        protein: proteins[0]?.name || 'Standard Protein',
        side: sides[0]?.name || 'Standard Side',
        flags: flaggedFoods,
      };
    });

    cache.set(CACHE_KEY_MEAL_PLANS, mealPlans);
    res.status(200).json(mealPlans);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
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