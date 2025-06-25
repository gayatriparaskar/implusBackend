const express = require("express");

const {sendGroupMessage, getGroupMessages } = require ("../controllers/groupChatController");

const groupChatRouter = express.Router();

groupChatRouter.post("/sendGroupMsg",sendGroupMessage);
groupChatRouter.get("/getGroupMsg/:groupId",getGroupMessages);

module.exports = groupChatRouter ; 
