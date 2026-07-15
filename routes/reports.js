const express = require('express');
const router = express.Router();
const c = require('../controllers/reportController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/pdf',   auth, adminOnly, c.generatePDF);
router.get('/excel', auth, adminOnly, c.generateExcel);

module.exports = router;
