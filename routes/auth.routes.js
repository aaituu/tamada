const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Публичные маршруты
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Защищённые маршруты
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;