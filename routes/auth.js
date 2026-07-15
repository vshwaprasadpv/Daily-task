const express = require('express');
const router = express.Router();
const c = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/login', c.login);
router.get('/me',  auth, c.me);

module.exports = router;
