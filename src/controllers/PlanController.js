const { successResponse, errorResponse } = require('../helper/successAndError');
const PlanModel = require('../models/Plan');

// Create a new plan
module.exports.createPlan = async (req, res) => {
  try {
    const plan = await PlanModel.create(req.body);
    res.status(201).json(successResponse(201, 'Plan created successfully', plan));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Failed to create plan', error.message));
  }
};

// Get all plans
module.exports.getAllPlans = async (req, res) => {
  try {
    const plans = await PlanModel.find();
    res.status(200).json(successResponse(200, 'Plans fetched successfully', plans));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Failed to fetch plans', error.message));
  }
};

// Get a single plan by ID
module.exports.getPlanById = async (req, res) => {
  try {
    const plan = await PlanModel.findById(req.params.id);
    if (!plan) return res.status(404).json(errorResponse(404, 'Plan not found'));
    res.status(200).json(successResponse(200, 'Plan fetched successfully', plan));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Error fetching plan', error.message));
  }
};

// Update a plan
module.exports.updatePlan = async (req, res) => {
  try {
    const plan = await PlanModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json(errorResponse(404, 'Plan not found for update'));
    res.status(200).json(successResponse(200, 'Plan updated successfully', plan));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Failed to update plan', error.message));
  }
};

// Delete a plan
module.exports.deletePlan = async (req, res) => {
  try {
    const plan = await PlanModel.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json(errorResponse(404, 'Plan not found for deletion'));
    res.status(200).json(successResponse(200, 'Plan deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Failed to delete plan', error.message));
  }
};
