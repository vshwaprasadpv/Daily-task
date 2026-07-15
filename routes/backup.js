const express = require('express');
const router = express.Router();
const c = require('../controllers/backupController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/',              auth, adminOnly, c.list);
router.post('/create',       auth, adminOnly, c.create);
router.post('/restore/:id',  auth, adminOnly, c.restore);
router.delete('/:id',        auth, adminOnly, c.remove);

module.exports = router;
