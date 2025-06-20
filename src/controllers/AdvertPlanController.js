const { successResponse, errorResponse } = require('../helper/successAndError');
const AdvertPlanModel = require('../models/advertisePlan');

// Create a new AdvertPlan
module.exports.createAdvertPlan = async (req, res) => {
  try {
    const advertPlan = await AdvertPlanModel.create(req.body);
    res.status(201).json(successResponse(201, 'Advert plan created successfully', advertPlan));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Failed to create advert plan', error.message));
  }
};

// Get all AdvertPlans
module.exports.getAllAdvertPlans = async (req, res) => {
  try {
    const advertPlans = await AdvertPlanModel.find();
    res.status(200).json(successResponse(200, 'Advert plans fetched successfully', advertPlans));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Failed to fetch advert plans', error.message));
  }
};

// Get a single AdvertPlan by ID
module.exports.getAdvertPlanById = async (req, res) => {
  try {
    const advertPlan = await AdvertPlanModel.findById(req.params.id);
    if (!advertPlan) return res.status(404).json(errorResponse(404, 'Advert plan not found'));
    res.status(200).json(successResponse(200, 'Advert plan fetched successfully', advertPlan));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Error fetching advert plan', error.message));
  }
};

// Update an AdvertPlan
module.exports.updateAdvertPlan = async (req, res) => {
  try {
    const advertPlan = await AdvertPlanModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!advertPlan) return res.status(404).json(errorResponse(404, 'Advert plan not found for update'));
    res.status(200).json(successResponse(200, 'Advert plan updated successfully', advertPlan));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Failed to update advert plan', error.message));
  }
};

// Delete an AdvertPlan
module.exports.deleteAdvertPlan = async (req, res) => {
  try {
    const advertPlan = await AdvertPlanModel.findByIdAndDelete(req.params.id);
    if (!advertPlan) return res.status(404).json(errorResponse(404, 'Advert plan not found for deletion'));
    res.status(200).json(successResponse(200, 'Advert plan deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(500, 'Failed to delete advert plan', error.message));
  }
};
