    const express = require("express");
const { getMessage,sendMessage , getCombinedChatList ,getchatList , getUnifiedChatList} = require("../controllers/chatController");

const chatRouter = express.Router();

chatRouter.post("/sendMessages/send",sendMessage);
chatRouter.get("/getMessages/:user1/:user2",getMessage);
// chatRouter.get("/combined-chat-list/:userId",getCombinedChatList);
chatRouter.get("/full-chat-list/:userId",getchatList);
// chatRouter.get("/chat-list/:userId",getUnifiedChatList);

module.exports = chatRouter ;