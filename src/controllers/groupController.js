const mongoose = require("mongoose");
const { successResponse, errorResponse } = require("../helper/successAndError");
const ObjectId = mongoose.Types.ObjectId;

const GroupModel = require("../models/Group");
const GroupChatModel = require("../models/GroupChat");

const { onlineUsers } = require("../socket/socket");

// app.post('/groups', async (req, res) => {
module.exports.createGroup = async (req, res) => {
  try {
    const { name, members, admins } = req.body;
    // Convert strings to ObjectIds
    const creatorId = req.userId; // ✅ Assuming you extract this from JWT or session
    const memberIds = members.map((id) => new ObjectId(id));
    const adminIds = admins.map((id) => new ObjectId(id));
    const creatorObjId = new ObjectId(creatorId);
    // ✅ Include creator in members if not already
    if (!memberIds.some((id) => id.equals(creatorObjId))) {
      memberIds.push(new ObjectId(creatorObjId));
    }

    // ✅ Include creator in admins if not already
    if (!adminIds.some((id) => id.equals(creatorObjId))) {
      adminIds.push(new ObjectId(creatorObjId));
    }

    // ✅ Make sure every admin is also in members
    adminIds.forEach((adminId) => {
      if (!memberIds.some((id) => id.equals(adminId))) {
        memberIds.push(adminId); // ✅ Add missing admin to members
      }
    });

    const group = await GroupModel.create({
      name,
      members: memberIds,
      admins: adminIds,
    });
    // ✅ Emit to online members
    //    memberIds.forEach((memberId) => {
    //   const socketId = onlineUsers[memberId.toString()];
    //   if (socketId) {
    //     io.to(socketId).emit("chatListUpdate");
    //   }
    // });

    // 🔁 Notify all group members (except creator optionally)
    members.forEach((memberId) => {
      const sid = onlineUsers[memberId.toString()];
      if (sid) {
        io.to(sid).emit("newGroupCreated", {
          success: true,
          group,
        });
      }
    });

    // res.status(200)
    // .json(successResponse,"Group is created",group);
    res.status(200).json(successResponse("Group is created", group));
  } catch (error) {
    res.status(500).json(errorResponse("Group is not created", error.message));
  }
};

// app.get('/groups/:userId', async (req, res) => {
module.exports.getGroup = async (req, res) => {
  const userId = req.params.userId;

  try {
    const groups = await GroupModel.find({ members: new ObjectId(userId) })
      .populate("members", "userName dp") // Only selected fields
      .populate("admins", "userName");
    res.json(groups);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch groups", error: err.message });
  }
};

let io; // 👈 declare io reference

module.exports.setSocketIo = (ioInstance) => {
  io = ioInstance;
};

// app.post('/groups/:groupId/add-member', async (req, res) => {
module.exports.addMembers = async (req, res) => {
  const { groupId } = req.params;
  const { userIdToAdd } = req.body;

  try {
    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userObjectId = new ObjectId(userIdToAdd);

    if (group.members.includes(userObjectId)) {
      return res.status(400).json({ message: "User already a member" });
    }

    group.members.push(userObjectId);
    await group.save();

    // ✅ Optional: Notify sockets in the group
    io.to(groupId).emit("groupMemberAdded", {
      groupId,
      newMember: userIdToAdd,
    });

    res.json({ message: "User added", group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding member" });
  }
};

// app.get('/group-messages/:groupId', async (req, res) => {
module.exports.groupMessage = async (req, res) => {
  const messages = await GroupChat.find({ groupId: req.params.groupId }).sort({
    timestamp: 1,
  });
  res.json(messages);
};
