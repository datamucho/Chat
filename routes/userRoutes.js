const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(userController.registerUser)
  .get(authMiddleware.protect, userController.getAllUsers);
router.route("/login").post(userController.authUser);

module.exports = router;
