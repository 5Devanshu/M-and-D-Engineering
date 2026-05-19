const axios = require('axios');
const logger = require('../config/logger');

const BMS_API_BASE_URL = process.env.BMS_API_URL || 'http://localhost:3001';
const BMS_API_KEY = process.env.BMS_API_KEY;

/**
 * BMS Integration Service
 * Handles all communication with BMS API
 */
class BMSIntegrationService {
  /**
   * Create API client with authentication
   */
  static getAxiosInstance() {
    const instance = axios.create({
      baseURL: BMS_API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add API key if available
    if (BMS_API_KEY) {
      instance.defaults.headers.common['x-api-key'] = BMS_API_KEY;
    }

    return instance;
  }

  /**
   * Create a bill in BMS
   * @param {Object} billData - Bill data to create
   * @returns {Object} Created bill response from BMS
   */
  static async createBillInBMS(billData) {
    try {
      logger.info('[BMS Integration] Creating bill in BMS', { billData });
      
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.post('/api/invoices/create', {
        ...billData,
        source: 'M_and_D_Engineering',
        createdAt: new Date().toISOString(),
      });

      logger.info('[BMS Integration] Bill created successfully in BMS', { 
        bmsInvoiceId: response.data?.id,
        invoiceNumber: response.data?.invoice_number,
      });

      return response.data;
    } catch (error) {
      logger.error('[BMS Integration] Failed to create bill in BMS', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`Failed to create bill in BMS: ${error.message}`);
    }
  }

  /**
   * Get bill from BMS
   * @param {String} invoiceId - Invoice ID in BMS
   * @returns {Object} Bill details from BMS
   */
  static async getBillFromBMS(invoiceId) {
    try {
      logger.info('[BMS Integration] Fetching bill from BMS', { invoiceId });
      
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.get(`/api/invoices/${invoiceId}`);

      return response.data;
    } catch (error) {
      logger.error('[BMS Integration] Failed to fetch bill from BMS', {
        error: error.message,
        invoiceId,
      });
      throw new Error(`Failed to fetch bill from BMS: ${error.message}`);
    }
  }

  /**
   * Update bill in BMS
   * @param {String} invoiceId - Invoice ID in BMS
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated bill response from BMS
   */
  static async updateBillInBMS(invoiceId, updateData) {
    try {
      logger.info('[BMS Integration] Updating bill in BMS', { invoiceId, updateData });
      
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.put(`/api/invoices/${invoiceId}`, updateData);

      return response.data;
    } catch (error) {
      logger.error('[BMS Integration] Failed to update bill in BMS', {
        error: error.message,
        invoiceId,
      });
      throw new Error(`Failed to update bill in BMS: ${error.message}`);
    }
  }

  /**
   * Sync masters/clients from M&D to BMS
   * @param {Object} clientData - Client data to sync
   * @returns {Object} Sync response from BMS
   */
  static async syncClientToBMS(clientData) {
    try {
      logger.info('[BMS Integration] Syncing client to BMS', { clientData });
      
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.post('/api/clients/create', {
        ...clientData,
        source: 'M_and_D_Engineering',
        synced_at: new Date().toISOString(),
      });

      logger.info('[BMS Integration] Client synced successfully', { 
        bmsClientId: response.data?.id,
      });

      return response.data;
    } catch (error) {
      logger.error('[BMS Integration] Failed to sync client to BMS', {
        error: error.message,
        status: error.response?.status,
      });
      throw new Error(`Failed to sync client to BMS: ${error.message}`);
    }
  }

  /**
   * Get list of clients from BMS
   * @returns {Array} List of clients from BMS
   */
  static async getClientsFromBMS() {
    try {
      logger.info('[BMS Integration] Fetching clients from BMS');
      
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.get('/api/clients');

      return response.data?.data || [];
    } catch (error) {
      logger.error('[BMS Integration] Failed to fetch clients from BMS', {
        error: error.message,
      });
      throw new Error(`Failed to fetch clients from BMS: ${error.message}`);
    }
  }

  /**
   * Update stock/particulars in BMS
   * @param {Object} stockData - Stock data to update
   * @returns {Object} Update response from BMS
   */
  static async updateParticularInBMS(particularData) {
    try {
      logger.info('[BMS Integration] Updating particular in BMS', { particularData });
      
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.post('/api/particulars/create', {
        ...particularData,
        source: 'M_and_D_Engineering',
      });

      return response.data;
    } catch (error) {
      logger.error('[BMS Integration] Failed to update particular in BMS', {
        error: error.message,
      });
      throw new Error(`Failed to update particular in BMS: ${error.message}`);
    }
  }

  /**
   * Check BMS API health
   * @returns {Boolean} API health status
   */
  static async checkBMSHealth() {
    try {
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.get('/api/health');
      
      return response.status === 200 || response.data?.success === true;
    } catch (error) {
      logger.warn('[BMS Integration] BMS API health check failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Sync bill payment status to BMS
   * @param {String} invoiceId - Invoice ID in BMS
   * @param {String} status - Payment status
   * @returns {Object} Update response
   */
  static async updatePaymentStatusInBMS(invoiceId, status) {
    try {
      logger.info('[BMS Integration] Updating payment status in BMS', { invoiceId, status });
      
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.put(`/api/invoices/${invoiceId}/status`, {
        status,
        updatedAt: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      logger.error('[BMS Integration] Failed to update payment status in BMS', {
        error: error.message,
        invoiceId,
      });
      throw new Error(`Failed to update payment status in BMS: ${error.message}`);
    }
  }
}

module.exports = BMSIntegrationService;
