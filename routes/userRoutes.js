const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

// Ruta para cambiar el rol de un usuario
router.put('/:uid/change-role', UserController.changeUserRole);

// Ruta para obtener el perfil de un usuario
router.get('/:userId', UserController.getUserProfile);

module.exports = router;
