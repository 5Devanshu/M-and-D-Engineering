/**
 * BMS API Service
 * Handles all communications with the BMS API
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../config/logger');

class BMSAPIService {
  constructor() {
    this.apiUrl = env.bms.apiUrl;
    this.apiKey = env.bms.apiKey;
    this.apiSecret = env.bms.apiSecret;
  }

  /**
   * Generate HMAC signature for API requests
   */
  generateSignature(payload, timestamp) {
    const message = payload ? `${JSON.stringify(payload)}${timestamp}` : `${timestamp}`;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  /**
   * Make authenticated request to BMS API
   */
  async makeRequest(method, endpoint, payload = null) {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = Date.now().toString();
        const signature = this.generateSignature(payload, timestamp);

        const url = new URL(`${this.apiUrl}${endpoint}`);
        const protocol = url.protocol === 'https:' ? https : http;

        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'X-Timestamp': timestamp,
            'X-Signature': signature,
          },
        };

        const req = protocol.request(url, options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const responseData = JSON.parse(data);

              if (res.statusCode >= 200 && res.statusCode < 300) {
                logger.info(`BMS API ${method} ${endpoint}: Success`, { statusCode: res.statusCode });
                resolve(responseData);
              } else {
                const error = new Error(
                  responseData.message || `BMS API Error: ${res.statusCode}`
                );
                error.statusCode = res.statusCode;
                error.response = responseData;
                logger.error(`BMS API ${method} ${endpoint}: Error`, error);
                reject(error);
              }
            } catch (parseError) {
              logger.error(`BMS API Response Parse Error`, parseError);
              reject(parseError);
            }
          });
        });

        req.on('error', (error) => {
          logger.error(`BMS API Request Error`, error);
          reject(error);
        });

        if (payload) {
          req.write(JSON.stringify(payload));
        }

        req.end();
      } catch (error) {
        logger.error(`BMS API Service Error`, error);
        reject(error);
      }
    });
  }

  async getInvoices(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/v1/invoices${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest('GET', endpoint);
  }

  async getInvoiceById(invoiceId) {
    return this.makeRequest('GET', `/v1/invoices/${invoiceId}`);
  }

  async createInvoice(invoiceData) {
    return this.makeRequest('POST', '/v1/invoices', invoiceData);
  }

  async updateInvoice(invoiceId, invoiceData) {
    return this.makeRequest('PUT', `/v1/invoices/${invoiceId}`, invoiceData);
  }

  async deleteInvoice(invoiceId) {
    return this.makeRequest('DELETE', `/v1/invoices/${invoiceId}`);
  }

  async getClients(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/v1/clients${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest('GET', endpoint);
  }

  async createClient(clientData) {
    return this.makeRequest('POST', '/v1/clients', clientData);
  }

  async getPayments(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/v1/payments${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest('GET', endpoint);
  }

  async recordPayment(paymentData) {
    return this.makeRequest('POST', '/v1/payments', paymentData);
  }

  async getBillingParticulars(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/v1/particulars${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest('GET', endpoint);
  }

  async getTaxRates(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/v1/tax-rates${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest('GET', endpoint);
  }

  async testConnection() {
    try {
      const result = await this.makeRequest('GET', '/health');
      logger.info('BMS API Connection Test: Success');
      return { success: true, data: result };
    } catch (error) {
      logger.error('BMS API Connection Test: Failed', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BMSAPIService();