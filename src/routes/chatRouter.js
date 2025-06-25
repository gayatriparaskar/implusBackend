const express = require("express");
const { sendMessage, getMessages, getchatList , getUnifiedChatList} = require("../controllers/chatController");
const { uploadFile } = require("../controllers/fileUploadController");

const chatRouter = express.Router();

chatRouter.post("/messages/:user1/:user2",sendMessage);
// chatRouter.get("/combined-chat-list/:userId",getCombinedChatList);
chatRouter.get("/messages/:user1/:user2",getMessages);

chatRouter.get("/full-chat-list/:userId",getchatList);
// chatRouter.get("/chat-list/:userId",getUnifiedChatList);
chatRouter.post("/upload", uploadFile, (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(200).json({ fileUrl });
});

module.exports = chatRouter ;