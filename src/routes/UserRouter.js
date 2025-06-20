
const express = require ("express");
const authentication = require ("../middleware/authentication");
const checkRole = require("../middleware/authorization");
const { createUser , getAllUser , updateUer , deleteUser , adminLogin , getOneUser } = require ("../controllers/UserController");

const {
  createPlanOrder,
  activatePlanWebhook,
  
} = require("../controllers/paymentGatewayControllers");

const userRouter = express.Router();



userRouter.post("/createPlanOrder", authenticate, createPlanOrder);
userRouter.post("/activate-user-webhook", activatePlanWebhook);
userRouter.post("/createUser",createUser);
userRouter.get("/userDetails",authentication,checkRole("admin"),getAllUser);
userRouter.put("/updatedUser/:id",updateUer);
userRouter.delete("/deleteUser/:id",deleteUser);
userRouter.post("/login",adminLogin);
userRouter.get("/me",authentication,getOneUser); 

module.exports = userRouter ;

