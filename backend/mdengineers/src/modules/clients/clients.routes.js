const router       = require('express').Router();
const ctrl         = require('./clients.controller');
const { authenticate }      = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/processAccess.middleware');

router.use(authenticate);

router.get(   '/',    requirePermission('masters', 'view'), ctrl.getAll);
router.get(   '/:id', requirePermission('masters', 'view'), ctrl.getById);
router.post(  '/',    requirePermission('masters', 'edit'), ctrl.create);
router.put(   '/:id', requirePermission('masters', 'edit'), ctrl.update);
router.delete('/:id', requirePermission('masters', 'edit'), ctrl.deactivate);

module.exports = router;