const expressHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Message = require('../models/messageModel');
const User = require("../models/userModel");

exports.sendMessage = expressHandler(async (req, res, nex) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    res.sendStatus(400)
    throw new Error('Invalid data passed into request!');
  }

  var newMessage = {
    sender: req.user.id,
    content,
    chat: chatId
  }

  try {
    var message = await Message.create(newMessage)

    message = await message.populate("sender", "name pic");
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name pic email'
    })

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

})

exports.allMessages = expressHandler(async (req, res, next) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).populate('sender', 'name pic email').populate('chat')
    res.json(messages)
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
})

