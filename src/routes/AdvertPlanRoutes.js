const express = require('express');
const advertPlanRoutes = express.Router();
const {
  createAdvertPlan,
  getAllAdvertPlans,
  getAdvertPlanById,
  updateAdvertPlan,
  deleteAdvertPlan,
} = require('../controllers/advertPlan.controller');

// POST /api/advert-plans
advertPlanRoutes.post('/CreateAdvertPlan', createAdvertPlan);

// GET /api/advert-plans
advertPlanRoutes.get('/GetAllAdvertPlans', getAllAdvertPlans);

// GET /api/advert-plans/:id
advertPlanRoutes.get('/GetAdvertPlanById/:id', getAdvertPlanById);

// PUT /api/advert-plans/:id
advertPlanRoutes.put('/UpdateAdvertPlan/:id', updateAdvertPlan);

// DELETE /api/advert-plans/:id
advertPlanRoutes.delete('/DeleteAdvertPlan/:id', deleteAdvertPlan);

module.exports = advertPlanRoutes;
