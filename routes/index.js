const express = require('express');
const AppControllers = require('../controllers/AppController');

const router = express.Router();
const UsersController = require('../controllers/UsersController');

router.get('/status', AppControllers.getStatus);
router.get('/stats', AppControllers.getTotal);
router.post('/users', UsersController.postNew);
module.exports = router;
