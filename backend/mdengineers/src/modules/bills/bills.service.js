const db = require('../../config/db');
const logger = require('../../config/logger');
const BMSIntegrationService = require('../../services/bms.integration.service');

/**
 * Bills Service
 * Handles bill creation, retrieval, and updates with BMS sync
 */
class BillsService {
  /**
   * Create a new bill and sync to BMS
   * @param {Object} billData - Bill data
   * @param {String} userId - User ID creating the bill
   * @returns {Object} Created bill
   */
  static async createBill(billData, userId) {
    const client = await db.getConnection();
    
    try {
      await client.query('BEGIN');

      // Validate required fields
      if (!billData.customer_id || !billData.items || billData.items.length === 0) {
        throw new Error('customer_id and items are required');
      }

      // Check if customer exists
      const { rows: customerRows } = await client.query(
        'SELECT id, name, email FROM customers WHERE id = $1',
        [billData.customer_id]
      );

      if (!customerRows.length) {
        throw new Error('Customer not found');
      }

      const customer = customerRows[0];

      // Create bill in M&D database
      const { rows: billRows } = await client.query(
        `INSERT INTO bills (customer_id, total_amount, status, created_by, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, customer_id, total_amount, status, created_at`,
        [
          billData.customer_id,
          billData.total_amount || 0,
          'draft',
          userId,
        ]
      );

      const bill = billRows[0];

      // Insert bill items
      const itemsToInsert = billData.items.map((item, index) => [
        bill.id,
        item.particular_id,
        item.quantity,
        item.rate,
        item.amount,
      ]);

      for (const itemData of itemsToInsert) {
        await client.query(
          `INSERT INTO bill_items (bill_id, particular_id, quantity, rate, amount)
           VALUES ($1, $2, $3, $4, $5)`,
          itemData
        );
      }

      // Prepare data for BMS
      const bmsData = {
        client_name: customer.name,
        client_email: customer.email,
        particulars: billData.items.map(item => ({
          id: item.particular_id,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        total_amount: billData.total_amount,
        description: billData.description || '',
        due_date: billData.due_date || null,
        notes: billData.notes || '',
      };

      // Create bill in BMS
      let bmsBillResponse;
      try {
        bmsBillResponse = await BMSIntegrationService.createBillInBMS(bmsData);
        
        // Update bill with BMS reference
        await client.query(
          `UPDATE bills SET bms_invoice_id = $1, bms_invoice_number = $2, status = $3
           WHERE id = $4`,
          [bmsBillResponse.id, bmsBillResponse.invoice_number, 'synced', bill.id]
        );

        bill.bms_invoice_id = bmsBillResponse.id;
        bill.bms_invoice_number = bmsBillResponse.invoice_number;
        bill.status = 'synced';
      } catch (bmsError) {
        logger.warn('BMS sync failed, bill saved as draft', { error: bmsError.message });
        // Bill is saved but not synced to BMS
      }

      await client.query('COMMIT');

      logger.info('Bill created successfully', { billId: bill.id, userId });

      return {
        id: bill.id,
        customer_id: bill.customer_id,
        total_amount: bill.total_amount,
        status: bill.status,
        bms_invoice_id: bill.bms_invoice_id,
        bms_invoice_number: bill.bms_invoice_number,
        items: billData.items,
        created_at: bill.created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating bill', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get bill by ID
   * @param {String} billId - Bill ID
   * @returns {Object} Bill details
   */
  static async getBillById(billId) {
    try {
      const { rows: billRows } = await db.query(
        `SELECT b.*, c.name as customer_name, c.email as customer_email
         FROM bills b
         LEFT JOIN customers c ON b.customer_id = c.id
         WHERE b.id = $1`,
        [billId]
      );

      if (!billRows.length) {
        throw new Error('Bill not found');
      }

      const bill = billRows[0];

      // Get bill items
      const { rows: itemRows } = await db.query(
        `SELECT bi.*, p.name as particular_name
         FROM bill_items bi
         LEFT JOIN particulars p ON bi.particular_id = p.id
         WHERE bi.bill_id = $1`,
        [billId]
      );

      return {
        ...bill,
        items: itemRows,
      };
    } catch (error) {
      logger.error('Error fetching bill', { error: error.message, billId });
      throw error;
    }
  }

  /**
   * Get all bills with pagination
   * @param {Object} filters - Filter options
   * @returns {Object} Bills and pagination
   */
  static async getBills(filters = {}) {
    try {
      const limit = Math.min(parseInt(filters.limit) || 20, 100);
      const offset = parseInt(filters.offset) || 0;
      const status = filters.status || null;

      let query = 'SELECT b.*, c.name as customer_name FROM bills b LEFT JOIN customers c ON b.customer_id = c.id WHERE 1=1';
      const params = [];

      if (status) {
        query += ` AND b.status = $${params.length + 1}`;
        params.push(status);
      }

      if (filters.customer_id) {
        query += ` AND b.customer_id = $${params.length + 1}`;
        params.push(filters.customer_id);
      }

      // Get total count
      const { rows: countRows } = await db.query(
        `SELECT COUNT(*) as total FROM (${query}) as sub`,
        params
      );
      const total = parseInt(countRows[0].total);

      // Get paginated results
      query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const { rows } = await db.query(query, params);

      return {
        data: rows,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching bills', { error: error.message });
      throw error;
    }
  }

  /**
   * Update bill
   * @param {String} billId - Bill ID
   * @param {Object} updateData - Data to update
   * @param {String} userId - User ID performing update
   * @returns {Object} Updated bill
   */
  static async updateBill(billId, updateData, userId) {
    const client = await db.getConnection();
    
    try {
      await client.query('BEGIN');

      // Get current bill
      const { rows: billRows } = await client.query(
        'SELECT * FROM bills WHERE id = $1',
        [billId]
      );

      if (!billRows.length) {
        throw new Error('Bill not found');
      }

      const bill = billRows[0];

      // Only allow editing draft bills
      if (bill.status === 'synced') {
        throw new Error('Cannot edit synced bills. Please create a new bill.');
      }

      // Update bill
      const { rows: updatedBillRows } = await client.query(
        `UPDATE bills 
         SET customer_id = COALESCE($2, customer_id),
             total_amount = COALESCE($3, total_amount),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [billId, updateData.customer_id, updateData.total_amount]
      );

      // If items provided, update them
      if (updateData.items && updateData.items.length > 0) {
        await client.query('DELETE FROM bill_items WHERE bill_id = $1', [billId]);

        for (const item of updateData.items) {
          await client.query(
            `INSERT INTO bill_items (bill_id, particular_id, quantity, rate, amount)
             VALUES ($1, $2, $3, $4, $5)`,
            [billId, item.particular_id, item.quantity, item.rate, item.amount]
          );
        }
      }

      await client.query('COMMIT');
      logger.info('Bill updated', { billId, userId });

      return this.getBillById(billId);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating bill', { error: error.message, billId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Send/sync bill to BMS
   * @param {String} billId - Bill ID
   * @param {String} userId - User ID
   * @returns {Object} Bill with BMS sync status
   */
  static async sendBill(billId, userId) {
    const client = await db.getConnection();
    
    try {
      await client.query('BEGIN');

      // Get bill with items
      const bill = await this.getBillById(billId);

      if (!bill) {
        throw new Error('Bill not found');
      }

      // If already synced, return BMS invoice
      if (bill.status === 'synced' && bill.bms_invoice_id) {
        try {
          const bmsBill = await BMSIntegrationService.getBillFromBMS(bill.bms_invoice_id);
          await client.query('COMMIT');
          return { bill, bmsBill };
        } catch (error) {
          logger.warn('Failed to fetch bill from BMS', { error: error.message });
        }
      }

      // Get customer
      const { rows: customerRows } = await client.query(
        'SELECT * FROM customers WHERE id = $1',
        [bill.customer_id]
      );

      const customer = customerRows[0];

      // Prepare BMS data
      const bmsData = {
        client_name: customer.name,
        client_email: customer.email,
        particulars: bill.items.map(item => ({
          id: item.particular_id,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        total_amount: bill.total_amount,
        description: bill.description || '',
        due_date: bill.due_date || null,
        notes: bill.notes || '',
      };

      // Create or update in BMS
      let bmsBillResponse;
      if (bill.bms_invoice_id) {
        bmsBillResponse = await BMSIntegrationService.updateBillInBMS(bill.bms_invoice_id, bmsData);
      } else {
        bmsBillResponse = await BMSIntegrationService.createBillInBMS(bmsData);
      }

      // Update bill status
      await client.query(
        `UPDATE bills 
         SET status = 'synced', bms_invoice_id = $2, bms_invoice_number = $3, updated_at = NOW()
         WHERE id = $1`,
        [billId, bmsBillResponse.id, bmsBillResponse.invoice_number]
      );

      await client.query('COMMIT');
      logger.info('Bill sent to BMS', { billId, userId, bmsInvoiceId: bmsBillResponse.id });

      return {
        bill: { ...bill, status: 'synced', bms_invoice_id: bmsBillResponse.id },
        bmsBill: bmsBillResponse,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error sending bill to BMS', { error: error.message, billId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete/Cancel bill
   * @param {String} billId - Bill ID
   * @param {String} userId - User ID
   * @returns {Object} Deleted bill
   */
  static async deleteBill(billId, userId) {
    const client = await db.getConnection();
    
    try {
      await client.query('BEGIN');

      // Get bill
      const { rows: billRows } = await client.query(
        'SELECT * FROM bills WHERE id = $1',
        [billId]
      );

      if (!billRows.length) {
        throw new Error('Bill not found');
      }

      const bill = billRows[0];

      // Soft delete - mark as cancelled
      await client.query(
        `UPDATE bills SET status = 'cancelled', deleted_at = NOW() WHERE id = $1`,
        [billId]
      );

      await client.query('COMMIT');
      logger.info('Bill cancelled', { billId, userId });

      return { ...bill, status: 'cancelled' };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error deleting bill', { error: error.message, billId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Sync stock/particulars from M&D to BMS
   * @param {Array} particulars - Array of particulars/items
   * @returns {Array} Sync results
   */
  static async syncParticulars(particulars) {
    try {
      const results = [];

      for (const particular of particulars) {
        try {
          const result = await BMSIntegrationService.updateParticularInBMS({
            name: particular.name,
            hsn_code: particular.hsn_code,
            description: particular.description,
            unit: particular.unit,
            tax_applicable: particular.tax_applicable || false,
          });

          results.push({
            success: true,
            particular_id: particular.id,
            bms_id: result.id,
          });
        } catch (error) {
          results.push({
            success: false,
            particular_id: particular.id,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error syncing particulars', { error: error.message });
      throw error;
    }
  }
}

module.exports = BillsService;
