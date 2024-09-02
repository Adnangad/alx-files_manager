const AppControllers = require('../controllers/AppController');
const express = require('express');
const router = express.Router();

router.get('/status', AppControllers.getStatus);
router.get('/stats', AppControllers.getTotal);
module.exports = router;
