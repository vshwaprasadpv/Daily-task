const express = require('express');
const router = express.Router();
const c = require('../controllers/activityController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, c.getAll);

module.exports = router;
