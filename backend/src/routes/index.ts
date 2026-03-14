import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import * as inventoryController from '../controllers/inventory.controller';
import * as aiController from '../controllers/ai.controller';
import * as clinicalController from '../controllers/clinical.controller';
import * as foodPlanController from '../controllers/foodplan.controller';
import * as settingsController from '../controllers/settings.controller';
import * as authController from '../controllers/auth.controller';
import * as mealNutritionController from '../controllers/meal-nutrition.controller';

const router = Router();

// ==========================================
// AUTH API
// ==========================================
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authController.me);

// ==========================================
// PATIENTS API
// ==========================================
router.get('/patients', patientController.getAllPatients);
router.get('/patients/:id', patientController.getPatientById);
router.post('/patients', patientController.addPatient);
router.delete('/patients/:id', patientController.removePatient);
router.patch('/patients/:id/priority', patientController.updatePatientPriority);
router.patch('/patients/:id/bmi', patientController.updatePatientBMI);

// ==========================================
// INVENTORY API
// ==========================================
router.get('/inventory', inventoryController.getInventory);
router.post('/inventory', inventoryController.createInventoryItem);
router.patch('/inventory/:id', inventoryController.updateStock);

// ==========================================
// AI ENGINE API
// ==========================================
router.get('/analysis/patient/:id', aiController.getPatientAnalysis);
router.get('/analysis/inventory-needs', aiController.getBulkInventoryNeeds);
router.get('/analysis/meal-plans', aiController.getMealPlans);
router.get('/analysis/logs', aiController.getAiLogs);
router.post('/analysis/meal-nutrition', mealNutritionController.getMealNutrition);

// ==========================================
// AI FOOD PLAN API
// ==========================================
router.post('/food-plan/suggestions', foodPlanController.getSuggestions);
router.post('/food-plan/week-plan', foodPlanController.getWeekPlan);

// ==========================================
// CLINICAL OPTIONS API
// ==========================================
router.get('/medications', clinicalController.getMedications);
router.post('/medications', clinicalController.addMedication);
router.get('/allergies', clinicalController.getAllergies);
router.post('/allergies', clinicalController.addAllergy);

// ==========================================
// SETTINGS API
// ==========================================
router.get('/settings', settingsController.getSettings);
router.patch('/settings', settingsController.updateSettings);

export default router;