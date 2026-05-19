const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const BillsService = require('./bills.service');
const logger = require('../../config/logger');

/**
 * Bills Controller
 */
class BillsController {
  /**
   * Create a new bill
   * POST /api/bills
   */
  static create = asyncHandler(async (req, res) => {
    const { customer_id, items, total_amount, description, due_date, notes } = req.body;

    // Validate required fields
    if (!customer_id) {
      return ApiResponse.validationError(res, { customer_id: 'Customer ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return ApiResponse.validationError(res, { items: 'At least one item is required' });
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.particular_id || !item.quantity || !item.rate) {
        return ApiResponse.validationError(res, {
          items: `Item ${i + 1} must have particular_id, quantity, and rate`,
        });
      }
    }

    const bill = await BillsService.createBill(
      {
        customer_id,
        items,
        total_amount,
        description,
        due_date,
        notes,
      },
      req.user.id
    );

    logger.info('Bill created via API', { billId: bill.id, userId: req.user.id });

    return ApiResponse.created(res, bill, 'Bill created successfully');
  });

  /**
   * Get bill by ID
   * GET /api/bills/:billId
   */
  static getById = asyncHandler(async (req, res) => {
    const { billId } = req.params;

    const bill = await BillsService.getBillById(billId);

    return ApiResponse.success(res, bill, 'Bill retrieved successfully');
  });

  /**
   * Get all bills
   * GET /api/bills
   */
  static getAll = asyncHandler(async (req, res) => {
    const { limit, offset, status, customer_id } = req.query;

    const result = await BillsService.getBills({
      limit,
      offset,
      status,
      customer_id,
    });

    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      'Bills retrieved successfully'
    );
  });

  /**
   * Update bill
   * PUT /api/bills/:billId
   */
  static update = asyncHandler(async (req, res) => {
    const { billId } = req.params;
    const { customer_id, items, total_amount } = req.body;

    const bill = await BillsService.updateBill(
      billId,
      {
        customer_id,
        items,
        total_amount,
      },
      req.user.id
    );

    logger.info('Bill updated via API', { billId, userId: req.user.id });

    return ApiResponse.success(res, bill, 'Bill updated successfully');
  });

  /**
   * Send bill to BMS
   * POST /api/bills/:billId/send
   */
  static send = asyncHandler(async (req, res) => {
    const { billId } = req.params;

    const result = await BillsService.sendBill(billId, req.user.id);

    logger.info('Bill sent to BMS', { billId, userId: req.user.id });

    return ApiResponse.success(
      res,
      {
        bill: result.bill,
        bmsInvoice: result.bmsBill,
      },
      'Bill sent to BMS successfully'
    );
  });

  /**
   * Delete/Cancel bill
   * DELETE /api/bills/:billId
   */
  static delete = asyncHandler(async (req, res) => {
    const { billId } = req.params;

    const bill = await BillsService.deleteBill(billId, req.user.id);

    logger.info('Bill cancelled via API', { billId, userId: req.user.id });

    return ApiResponse.success(res, bill, 'Bill cancelled successfully');
  });

  /**
   * Sync stock/masters to BMS
   * POST /api/bills/sync-masters
   */
  static syncMasters = asyncHandler(async (req, res) => {
    const { particulars } = req.body;

    if (!particulars || !Array.isArray(particulars)) {
      return ApiResponse.validationError(res, {
        particulars: 'Particulars array is required',
      });
    }

    const result = await BillsService.syncParticulars(particulars);

    const successful = result.filter(r => r.success);
    const failed = result.filter(r => !r.success);

    logger.info('Masters synced to BMS', {
      total: result.length,
      successful: successful.length,
      failed: failed.length,
      userId: req.user.id,
    });

    return ApiResponse.success(
      res,
      {
        total: result.length,
        successful: successful.length,
        failed: failed.length,
        results: result,
      },
      `Synced ${successful.length} masters successfully`
    );
  });
}

module.exports = BillsController;
