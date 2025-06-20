// routes/advertisement.routes.js
const express = require("express");
const advertisementRoutes = express.Router();
const authenticate = require("../middleware/authenticateion");
const advertCtrl = require("../controllers/AdvertiseController");
const {
  createAdvertOrder,
  activateAdvertWebhook,
  
} = require("../controllers/advertiseGatewayController");

advertisementRoutes.post("/create", authenticate, advertCtrl.createAdvertisement);
advertisementRoutes.get("/myads", authenticate, advertCtrl.getUserAdvertisements);


advertisementRoutes.post("/createAdvertOrder", authenticate, createAdvertOrder);
advertisementRoutes.post("/activate-advert-webhook", activateAdvertWebhook);

module.exports = advertisementRoutes;
