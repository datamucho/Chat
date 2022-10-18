const express = require('express');
const authMiddleware = require('../middleware/authMiddleware')
const chatController = require('../controllers/chatController')

const router = express.Router();

router.route('/').post(authMiddleware.protect, chatController.accessChat);
router.route('/').get(authMiddleware.protect, chatController.getChats);
router.route('/group').post(authMiddleware.protect, chatController.createGroupChat);
router.route('/rename').put(authMiddleware.protect, chatController.renameChat);
router.route('/groupremove').put(authMiddleware.protect, chatController.removeFromGroup);
router.route('/groupadd').put(authMiddleware.protect, chatController.addToGroup);

module.exports = router;