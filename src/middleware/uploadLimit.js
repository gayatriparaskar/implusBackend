// middleware/uploadLimit.js
const UserModel = require("../models/User");
const PlanModel = require("../models/Plan");
const { errorResponse } = require("../helper/successAndError");

const checkUploadLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await UserModel.findById(userId).populate("planId");
    if (!user || !user.planId) {
      return res.status(403).json(errorResponse(403, "Plan not found for user"));
    }

    const plan = user.planId;
    const { imageLimit, videoLimit } = plan.features;

    const images = req.body.images || [];
    const videos = req.body.videos || [];

    if (imageLimit !== 0 && images.length > imageLimit) {
      return res.status(403).json(errorResponse(403, `Image limit exceeded. Allowed: ${imageLimit}`));
    }

    if (videoLimit !== 0 && videos.length > videoLimit) {
      return res.status(403).json(errorResponse(403, `Video limit exceeded. Allowed: ${videoLimit}`));
    }

    next();
  } catch (err) {
    return res.status(500).json(errorResponse(500, "Upload limit check failed", err.message));
  }
};

module.exports = checkUploadLimit;
