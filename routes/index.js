const express = require('express');
const AppControllers = require('../controllers/AppController');
const AuthController = require('../controllers/AuthController');
const FileController = require('../controllers/FileController');

const router = express.Router();
const UsersController = require('../controllers/UsersController');

router.get('/status', AppControllers.getStatus);
router.get('/stats', AppControllers.getTotal);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', FileController.postUpload);
module.exports = router;
