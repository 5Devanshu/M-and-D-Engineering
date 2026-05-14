const router = require('express').Router();
const ctrl   = require('./materials.controller');
const { authenticate }      = require('../../middlewares/auth.middleware');
const { requireRole }       = require('../../middlewares/role.middleware');
const { requirePermission } = require('../../middlewares/processAccess.middleware');
const { validate, createMaterialSchema, updateRateSchema } = require('./materials.validation');

router.use(authenticate);

router.get( '/',                    requirePermission('masters','view'),  ctrl.getAll);
router.get( '/:id',                 requirePermission('masters','view'),  ctrl.getById);
router.post('/',  requireRole('admin','manager'), validate(createMaterialSchema), ctrl.create);
router.put( '/:id', requireRole('admin','manager'), ctrl.update);
router.delete('/:id', requireRole('admin','manager'), ctrl.delete);

// Rate management
router.put(  '/:id/rate',          requireRole('admin','manager'), validate(updateRateSchema), ctrl.updateRate);
router.get(  '/:id/rate-history',  requirePermission('masters','view'),  ctrl.getRateHistory);
router.get(  '/:id/rate-on-date',  requirePermission('masters','view'),  ctrl.getRateOnDate);

module.exports = router;
