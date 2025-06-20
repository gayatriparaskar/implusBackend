const mongoose = require("mongoose");
const BussinessModel = require("../models/Business");
const { errorResponse, successResponse } = require("../helper/successAndError");
const UserModel = require("../models/User");
const PlanModel = require("../models/Plan");
const SubCategoryModel = require("../models/SubCategory"); // Adjust path as needed

module.exports.createBussiness = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user.id;

    // 1. Validate subcategory
    const subCategoryExists = await SubCategoryModel.findById(data.subCategory);
    if (!subCategoryExists) {
      return res.status(400).json(errorResponse(400, "Invalid subCategory ID"));
    }

    // 2. Check for duplicate business
    const existingBusiness = await BussinessModel.findOne({
      name: data.name,
      subCategory: data.subCategory,
    });
    if (existingBusiness) {
      return res.status(404).json(
        errorResponse(404, "Business already exists in this subCategory", existingBusiness)
      );
    }

    const plan = user.planId;
    const { imageLimit, videoLimit } = plan.features;

    const images = data.images || [];
    const videos = data.videos || [];

    // 4. Enforce upload limits
    if (imageLimit !== 0 && images.length > imageLimit) {
      return res.status(403).json(errorResponse(403, `Image upload limit exceeded. Allowed: ${imageLimit}`));
    }

    if (videoLimit !== 0 && videos.length > videoLimit) {
      return res.status(403).json(errorResponse(403, `Video upload limit exceeded. Allowed: ${videoLimit}`));
    }

    // 5. Create business
    const newBusiness = new BussinessModel({
      ...data,
      User: userId, // assuming this field exists
    });

    await newBusiness.save();

    await newBusiness.populate([
      { path: "category", select: "id name" },
      { path: "User", select: "id name" },
      { path: "subCategory", select: "id name" },
    ]);

    return res.status(200).json(
      successResponse(200, "Business added successfully", newBusiness)
    );

  } catch (error) {
    return res.status(500).json(errorResponse(500, "Something went wrong", error.message));
  }
};


module.exports.getBussiness = async (req, res) => {
  try {
    const getBussiness = await BussinessModel.find();
    res.status(200).json(successResponse(200, "Get Bussiness model", getBussiness));
  } catch (error) {
    res.status(500).json(errorResponse(500,error.message || "Invalid Credentials"));
  }
};

module.exports.updateBussiness = async (req, res) => {
  try {
    const id = req.params.id;
    const query = req.body;
    const updatedBuss = await BussinessModel.findByIdAndUpdate(id, query, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(successResponse(200, "Bussiness is updated", updatedBuss));
  } catch (error) {
    res.status(500).json(errorResponse(500, "Invalid Credentials"));
  }
};

module.exports.deletedBuss = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedBuss = await BussinessModel.findByIdAndDelete(id);
    res.status(200).json(successResponse(200, "Bussiness is deleted successfully", deletedBuss));
  } catch (error) {
    res.status(500).json(errorResponse(500, "Invalid Credentials"));
  }
};
