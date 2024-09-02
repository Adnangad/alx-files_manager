const express = require('express');
const AppControllers = require('../controllers/AppController');
const AuthController = require('../controllers/AuthController');

const router = express.Router();
const UsersController = require('../controllers/UsersController');

router.get('/status', AppControllers.getStatus);
router.get('/stats', AppControllers.getTotal);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
module.exports = router;
