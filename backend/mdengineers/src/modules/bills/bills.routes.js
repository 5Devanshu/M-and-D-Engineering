const router = require('express').Router();
const BillsController = require('./bills.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate, createBillSchema, updateBillSchema, syncMastersSchema } = require('./bills.validation');

/**
 * Bills Routes
 * All routes require authentication
 */

// Create a new bill
router.post('/', authenticate, validate(createBillSchema), BillsController.create);

// Get all bills (with pagination & filters)
router.get('/', authenticate, BillsController.getAll);

// Get bill by ID
router.get('/:billId', authenticate, BillsController.getById);

// Update bill
router.put('/:billId', authenticate, validate(updateBillSchema), BillsController.update);

// Send bill to BMS (create/sync)
router.post('/:billId/send', authenticate, BillsController.send);

// Delete/Cancel bill
router.delete('/:billId', authenticate, BillsController.delete);

// Sync masters/stock to BMS
router.post('/sync/masters', authenticate, validate(syncMastersSchema), BillsController.syncMasters);

module.exports = router;
