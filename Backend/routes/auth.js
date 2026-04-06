const express = require('express');
const { signup, signin, profile, listUsers, deleteUser } = require("../controllers/authController");
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get("/profile", protect, profile);
router.get("/", listUsers);  // <-- NEW route
router.delete("/:id", deleteUser);

module.exports = router;
