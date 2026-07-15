const express = require('express');
const router = express.Router();
const c = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

router.get('/stats', auth, c.getStats);

module.exports = router;
