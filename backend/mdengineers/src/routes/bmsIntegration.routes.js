/**
 * BMS Integration Routes
 */

const express = require('express');
const router = express.Router();
const bmsController = require('../controllers/bmsIntegration.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * Test BMS Connection
 * GET /api/bms/test
 */
router.get('/test', authenticate, bmsController.testBmsConnection);

/**
 * Invoice Routes
 */
router.get('/invoices', authenticate, bmsController.getBmsInvoices);
router.get('/invoices/:invoiceId', authenticate, bmsController.getBmsInvoiceById);
router.post('/invoices', authenticate, bmsController.createBmsInvoice);

/**
 * Client Routes
 */
router.get('/clients', authenticate, bmsController.getBmsClients);
router.post('/clients', authenticate, bmsController.createBmsClient);

/**
 * Payment Routes
 */
router.get('/payments', authenticate, bmsController.getBmsPayments);
router.post('/payments', authenticate, bmsController.recordBmsPayment);

/**
 * Billing Routes
 */
router.get('/billing-particulars', authenticate, bmsController.getBmsBillingParticulars);
router.get('/tax-rates', authenticate, bmsController.getBmsTaxRates);
router.get('/payments/modes/list', authenticate, bmsController.getBmsPayments);

module.exports = router;
