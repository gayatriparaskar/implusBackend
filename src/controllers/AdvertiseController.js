// controllers/advertisement.controller.js
const Advertisement = require("../models/Advertisement");
const AdvertPlan = require("../models/advertisePlan");
const { successResponse, errorResponse } = require("../helper/successAndError");

exports.createAdvertisement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, title, description, images = [], videos = [] } = req.body;

    const plan = await AdvertPlan.findById(planId);
    if (!plan) return res.status(400).json(errorResponse(400, "Invalid Plan ID"));

    if (plan.features.imageLimit !== 0 && images.length > plan.features.imageLimit)
      return res.status(403).json(errorResponse(403, `Image limit exceeded. Allowed: ${plan.features.imageLimit}`));
    
    if (plan.features.videoLimit !== 0 && videos.length > plan.features.videoLimit)
      return res.status(403).json(errorResponse(403, `Video limit exceeded. Allowed: ${plan.features.videoLimit}`));

    const advert = new Advertisement({
      user: userId,
      planId,
      title,
      description,
      images,
      videos
    });

    await advert.save();
    res.status(201).json(successResponse(201, "Advertisement created", advert));
  } catch (error) {
    res.status(500).json(errorResponse(500, "Failed to create ad", error.message));
  }
};

exports.getUserAdvertisements = async (req, res) => {
  try {
    const userId = req.user.id;
    const ads = await Advertisement.find({ user: userId }).populate("planId");
    res.status(200).json(successResponse(200, "User ads fetched", ads));
  } catch (error) {
    res.status(500).json(errorResponse(500, "Failed to fetch", error.message));
  }
};
