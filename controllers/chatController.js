const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");


exports.accessChat = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    console.log('userId param not sent with request!');
    return res.sendStatus(400)
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id, } } },
      { users: { $elemMatch: { $eq: userId } } }
    ]
  }).populate('users', "-password").populate('latestMessage');

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: 'name pic email',
  })

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user.id, userId]
    }

    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('users', '-password');

      res.status(200).send(fullChat)
    } catch (error) {
      res.status(400);
      throw new Error(error.message)
    }
  }

})

exports.getChats = asyncHandler(async (req, res, next) => {
  try {
    const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: 'name pic email'
        }),

          res.status(200).send(results);
      })

  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
})

exports.createGroupChat = asyncHandler(async (req, res, next) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: 'Please fill all the fields!' })
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to from a group chat!")
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user
    })
    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).send(fullGroupChat)
  } catch (error) {
    console.log(error)
  }
})

exports.renameChat = asyncHandler(async (req, res, next) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(chatId, { chatName }, { new: true })
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (updatedChat) {
    res.json(updatedChat);
  } else {
    res.status(400);
    throw new Error('Chat not found!');
  }
})

exports.addToGroup = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(chatId, { $push: { users: userId } }, { new: true })
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (added) {
    res.status(200).json(added)
  } else {
    res.status(400);
    throw new Error('Chat not found')
  }
})

exports.removeFromGroup = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(chatId, { $pull: { users: userId } }, { new: true })
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (removed) {
    res.status(200).json(removed)
  } else {
    res.status(400);
    throw new Error('Chat not found')
  }
})