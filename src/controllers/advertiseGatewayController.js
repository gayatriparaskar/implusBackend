// controllers/advertiseGateway.controller.js
const AdvertPlan = require("../models/AdvertPlan");
const UpiOrder = require("../models/upiOrderModel");
const User = require("../models/User");
const { createRazorpayOrder } = require("../utility/razorpay-gateway");
const ShortUniqueId = require("short-unique-id");
const { successResponse, errorResponse } = require("../helper/successAndError");

const uid = new ShortUniqueId({ length: 10 });

exports.createAdvertOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { planId, successUrl, failedUrl } = req.body;

    const plan = await AdvertPlan.findById(planId);
    if (!plan) throw new Error("Plan not found");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const amount = parseInt(plan.offerPrice || plan.price);
    const orderId = uid.rnd();

    const newOrder = new UpiOrder({
      orderId,
      user: userId,
      plan: planId,
      planName: plan.name,
      price: plan.price,
      amount,
      gateway: "razorpay",
      type: "advertisement"
    });
    await newOrder.save();

    const razorOrder = await createRazorpayOrder(
      amount,
      `advert-${newOrder._id}`,
      user.email,
      user.phone,
      user.name,
      successUrl,
      failedUrl
    );

    res.status(200).json(successResponse(200, "Ad order created", razorOrder));
  } catch (error) {
    res.status(500).json(errorResponse(500, "Order creation failed", error.message));
  }
};

exports.activateAdvertWebhook = async (req, res) => {
  try {
    const data = req.body.payload.payment.entity;
    const orderIdParts = data.notes.orderId.split("-");
    
    if (orderIdParts[0] !== "advert") throw new Error("Not an advert order");

    const orderId = orderIdParts[1];

    const order = await UpiOrder.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: "success" } },
      { new: true }
    );

    const user = await User.findById(order.user);
    if (!user) throw new Error("User not found");

    // Optionally, activate or notify user to now create ad
    return res.status(200).json({ status: "OK" });
  } catch (error) {
    res.status(500).json(errorResponse(500, "Webhook error", error.message));
  }
};
