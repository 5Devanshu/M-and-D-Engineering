/**
 * BMS Integration Controller
 * Test and manage BMS API integration
 */

const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const bmsApiService = require('../services/bmsApi.service');
const logger = require('../config/logger');

/**
 * Test BMS API Connection
 */
exports.testBmsConnection = asyncHandler(async (req, res) => {
  logger.info('Testing BMS API connection...');
  
  const result = await bmsApiService.testConnection();
  
  return res.json(
    new ApiResponse(
      result.success ? 200 : 500,
      result,
      result.success ? 'BMS API connection successful' : 'BMS API connection failed'
    )
  );
});

/**
 * Get Invoices from BMS
 */
exports.getBmsInvoices = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching invoices from BMS', { filters });

  const data = await bmsApiService.getInvoices(filters);

  return res.json(
    new ApiResponse(200, data, 'Invoices fetched successfully')
  );
});

/**
 * Get Invoice by ID from BMS
 */
exports.getBmsInvoiceById = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  logger.info('Fetching invoice from BMS', { invoiceId });

  const data = await bmsApiService.getInvoiceById(invoiceId);

  return res.json(
    new ApiResponse(200, data, 'Invoice fetched successfully')
  );
});

/**
 * Create Invoice in BMS
 */
exports.createBmsInvoice = asyncHandler(async (req, res) => {
  const invoiceData = req.body;
  logger.info('Creating invoice in BMS', { invoiceData });

  const data = await bmsApiService.createInvoice(invoiceData);

  return res.json(
    new ApiResponse(201, data, 'Invoice created successfully in BMS')
  );
});

/**
 * Get Clients from BMS
 */
exports.getBmsClients = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching clients from BMS', { filters });

  const data = await bmsApiService.getClients(filters);

  return res.json(
    new ApiResponse(200, data, 'Clients fetched successfully')
  );
});

/**
 * Create Client in BMS
 */
exports.createBmsClient = asyncHandler(async (req, res) => {
  const clientData = req.body;
  logger.info('Creating client in BMS', { clientData });

  const data = await bmsApiService.createClient(clientData);

  return res.json(
    new ApiResponse(201, data, 'Client created successfully in BMS')
  );
});

/**
 * Get Payments from BMS
 */
exports.getBmsPayments = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching payments from BMS', { filters });

  const data = await bmsApiService.getPayments(filters);

  return res.json(
    new ApiResponse(200, data, 'Payments fetched successfully')
  );
});

/**
 * Record Payment in BMS
 */
exports.recordBmsPayment = asyncHandler(async (req, res) => {
  const paymentData = req.body;
  logger.info('Recording payment in BMS', { paymentData });

  const data = await bmsApiService.recordPayment(paymentData);

  return res.json(
    new ApiResponse(201, data, 'Payment recorded successfully in BMS')
  );
});

/**
 * Get Billing Particulars from BMS
 */
exports.getBmsBillingParticulars = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching billing particulars from BMS', { filters });

  const data = await bmsApiService.getBillingParticulars(filters);

  return res.json(
    new ApiResponse(200, data, 'Billing particulars fetched successfully')
  );
});

/**
 * Get Tax Rates from BMS
 */
exports.getBmsTaxRates = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching tax rates from BMS', { filters });

  const data = await bmsApiService.getTaxRates(filters);

  return res.json(
    new ApiResponse(200, data, 'Tax rates fetched successfully')
  );
});
