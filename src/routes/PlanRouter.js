const express = require('express');
const planRoutes = express.Router();
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} = require('../controllers/plan.controller');

// POST /api/plans
planRoutes.post('/CreatePlan', createPlan);

// GET /api/plans
planRoutes.get('/GetAllPlans', getAllPlans);

// GET /api/plans/:id
planRoutes.get('/GetPlanById/:id', getPlanById);

// PUT /api/plans/:id
planRoutes.put('/UpdatePlan/:id', updatePlan);

// DELETE /api/plans/:id
planRoutes.delete('/DeletePlan/:id', deletePlan);

module.exports = planRoutes;
