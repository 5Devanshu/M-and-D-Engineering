const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');   // ← no curly braces
const bmsApiService = require('../services/bmsApi.service');
const logger = require('../config/logger');

exports.testBmsConnection = asyncHandler(async (req, res) => {
  const result = await bmsApiService.testConnection();
  return result.success
    ? ApiResponse.success(res, result, 'BMS API connection successful')
    : ApiResponse.error(res, 'BMS API connection failed', 500);
});

exports.getBmsInvoices = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching invoices from BMS', { filters });
  const data = await bmsApiService.getInvoices(filters);
  return ApiResponse.success(res, data, 'Invoices fetched successfully');
});

exports.getBmsInvoiceById = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  logger.info('Fetching invoice from BMS', { invoiceId });
  const data = await bmsApiService.getInvoiceById(invoiceId);
  return ApiResponse.success(res, data, 'Invoice fetched successfully');
});

exports.createBmsInvoice = asyncHandler(async (req, res) => {
  const invoiceData = req.body;
  logger.info('Creating invoice in BMS', { invoiceData });
  const data = await bmsApiService.createInvoice(invoiceData);
  return ApiResponse.created(res, data, 'Invoice created successfully in BMS');
});

exports.getBmsClients = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching clients from BMS', { filters });
  const data = await bmsApiService.getClients(filters);
  return ApiResponse.success(res, data, 'Clients fetched successfully');
});

exports.createBmsClient = asyncHandler(async (req, res) => {
  const clientData = req.body;
  logger.info('Creating client in BMS', { clientData });
  const data = await bmsApiService.createClient(clientData);
  return ApiResponse.created(res, data, 'Client created successfully in BMS');
});

exports.getBmsPayments = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching payments from BMS', { filters });
  const data = await bmsApiService.getPayments(filters);
  return ApiResponse.success(res, data, 'Payments fetched successfully');
});

exports.recordBmsPayment = asyncHandler(async (req, res) => {
  const paymentData = req.body;
  logger.info('Recording payment in BMS', { paymentData });
  const data = await bmsApiService.recordPayment(paymentData);
  return ApiResponse.created(res, data, 'Payment recorded successfully in BMS');
});

exports.getBmsBillingParticulars = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching billing particulars from BMS', { filters });
  const data = await bmsApiService.getBillingParticulars(filters);
  return ApiResponse.success(res, data, 'Billing particulars fetched successfully');
});

exports.getBmsTaxRates = asyncHandler(async (req, res) => {
  const filters = req.query;
  logger.info('Fetching tax rates from BMS', { filters });
  const data = await bmsApiService.getTaxRates(filters);
  return ApiResponse.success(res, data, 'Tax rates fetched successfully');
});