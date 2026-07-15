const express = require('express');
const router = express.Router();
const c = require('../controllers/okrController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/',                            auth, c.getAll);
router.get('/:id',                         auth, c.getOne);
router.post('/',                           auth, adminOnly, c.create);
router.put('/:id',                         auth, adminOnly, c.update);
router.delete('/:id',                      auth, adminOnly, c.remove);
router.patch('/:id/key-results/:krId',     auth, adminOnly, c.updateKeyResult);

module.exports = router;
