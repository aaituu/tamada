const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Все маршруты защищены
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.post('/track-game', userController.trackGameVisit);

module.exports = router;