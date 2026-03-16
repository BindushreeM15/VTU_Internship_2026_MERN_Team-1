const express = require('express');
const { signup, login } = require('../controllers/builderController');
const { updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', signup);
router.post('/login', login);
router.put('/update-profile', authenticate, updateProfile);

module.exports = router;