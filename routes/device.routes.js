const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Все маршруты защищены
router.use(authenticate);

router.get('/', deviceController.getUserDevices);
router.delete('/:deviceId', deviceController.deleteDevice);
router.delete('/all/except-current', deviceController.deleteAllDevicesExceptCurrent);

module.exports = router;