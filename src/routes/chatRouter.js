const express = require("express");
const { sendMessage , getCombinedChatList ,getchatList , getUnifiedChatList} = require("../controllers/chatController");

const chatRouter = express.Router();

chatRouter.get("/messages/:user1/:user2",sendMessage);
// chatRouter.get("/combined-chat-list/:userId",getCombinedChatList);
chatRouter.get("/full-chat-list/:userId",getchatList);
// chatRouter.get("/chat-list/:userId",getUnifiedChatList);

module.exports = chatRouter ;