import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import * as inventoryController from '../controllers/inventory.controller';
import * as aiController from '../controllers/ai.controller';

const router = Router();

// ==========================================
// PATIENTS API
// ==========================================
router.get('/patients', patientController.getAllPatients);
router.get('/patients/:id', patientController.getPatientById);
router.post('/patients', patientController.addPatient);
router.delete('/patients/:id', patientController.removePatient);

// ==========================================
// INVENTORY API
// ==========================================
router.get('/inventory', inventoryController.getInventory);
router.patch('/inventory/:id', inventoryController.updateStock);

// ==========================================
// AI ENGINE API
// ==========================================
router.get('/analysis/patient/:id', aiController.getPatientAnalysis);
router.get('/analysis/inventory-needs', aiController.getBulkInventoryNeeds);
router.get('/analysis/meal-plans', aiController.getMealPlans);
router.get('/analysis/logs', aiController.getAiLogs);

export default router;