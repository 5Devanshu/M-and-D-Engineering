# BMS API Integration Guide

## Overview
This document explains how the M&D Engineering backend is integrated with the BMS (Billing Management System) API.

## Configuration

### API Credentials
The BMS API credentials have been configured in the system:

**API Key:** `2ddfda4cc80bcd0835a102192d72deda5b5e3a52ba6cd17e850d618a95a3d097`

**API Secret:** `02d1f36d16806e5638d16b068ffec439efc1895b9c9595902cfec7debd4541168c16f3676a05474771c3937171b58f4cafaa112abb31bbe398e4bd5c53005776`

**API Base URL:** `http://localhost:5000/api` (default)

### Environment Variables
Add these to your `.env` file:

```env
# BMS API Integration
BMS_API_URL=http://localhost:5000/api
BMS_API_KEY=2ddfda4cc80bcd0835a102192d72deda5b5e3a52ba6cd17e850d618a95a3d097
BMS_API_SECRET=02d1f36d16806e5638d16b068ffec439efc1895b9c9595902cfec7debd4541168c16f3676a05474771c3937171b58f4cafaa112abb31bbe398e4bd5c53005776
```

## Files Created

### 1. **Service Layer** (`src/services/bmsApi.service.js`)
- Handles all API communication with BMS
- Implements HMAC-SHA256 signature generation for request authentication
- Provides methods for:
  - Getting invoices (list and by ID)
  - Creating/updating/deleting invoices
  - Managing clients
  - Recording payments
  - Fetching billing particulars and tax rates
  - Testing API connectivity

### 2. **Controller** (`src/controllers/bmsIntegration.controller.js`)
- Request handlers for BMS integration endpoints
- Validates input and calls service methods
- Returns standardized API responses

### 3. **Routes** (`src/routes/bmsIntegration.routes.js`)
- RESTful API endpoints for BMS integration
- All endpoints require authentication
- Base path: `/api/bms`

### 4. **Configuration** (`src/config/env.js`)
- Updated with BMS API credentials
- Loads from environment variables with fallback values

## API Endpoints

### Test Connection
```
GET /api/bms/test
```
Test BMS API connectivity

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "success": true,
    "message": "API is healthy"
  },
  "message": "BMS API connection successful"
}
```

### Invoices

#### Get All Invoices
```
GET /api/bms/invoices
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (draft, sent, paid, overdue, cancelled)
- `client_id` - Filter by client

#### Get Invoice by ID
```
GET /api/bms/invoices/:invoiceId
```

#### Create Invoice
```
POST /api/bms/invoices
```

**Request Body:**
```json
{
  "client_id": 1,
  "invoice_date": "2024-05-23",
  "due_date": "2024-06-23",
  "items": [
    {
      "description": "Item 1",
      "quantity": 10,
      "unit_price": 100,
      "tax_rate_id": 1
    }
  ],
  "notes": "Invoice notes"
}
```

### Clients

#### Get All Clients
```
GET /api/bms/clients
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `search` - Search by name or email
- `is_active` - Filter by active status

#### Create Client
```
POST /api/bms/clients
```

**Request Body:**
```json
{
  "client_code": "CLI001",
  "client_name": "Client Name",
  "email": "client@example.com",
  "phone": "1234567890",
  "billing_address": "123 Main St",
  "gstin": "18AABCT1234H1Z0",
  "pan": "AABCT1234H"
}
```

### Payments

#### Get All Payments
```
GET /api/bms/payments
```

#### Record Payment
```
POST /api/bms/payments
```

**Request Body:**
```json
{
  "invoice_id": 1,
  "amount": 1000,
  "payment_date": "2024-05-23",
  "payment_method": "bank_transfer",
  "reference_number": "TXN12345"
}
```

### Billing & Rates

#### Get Billing Particulars
```
GET /api/bms/billing-particulars
```

#### Get Tax Rates
```
GET /api/bms/tax-rates
```

## Authentication

All endpoints require authentication via JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The BMS API service includes comprehensive error handling:

- Network errors are logged and returned with descriptive messages
- HTTP error statuses (4xx, 5xx) are caught and returned appropriately
- Response parsing errors are handled gracefully
- All errors are logged using the Winston logger

## Usage Example

```javascript
const bmsApiService = require('./services/bmsApi.service');

// Get invoices with filters
const invoices = await bmsApiService.getInvoices({
  page: 1,
  limit: 10,
  status: 'paid'
});

// Create a new client
const newClient = await bmsApiService.createClient({
  client_code: 'CLI123',
  client_name: 'New Client',
  email: 'newclient@example.com'
});

// Record a payment
const payment = await bmsApiService.recordPayment({
  invoice_id: 5,
  amount: 5000,
  payment_method: 'bank_transfer'
});
```

## Logging

All BMS API requests and responses are logged using Winston logger:

- **INFO level:** Successful requests
- **ERROR level:** Failed requests and exceptions
- Log file locations: `logs/` directory

To view logs in real-time:
```bash
tail -f logs/combined.log
```

## Testing the Integration

### Step 1: Start M&D Engineers Backend
```bash
cd /Users/devanshu/Desktop/"M and D Engineering"/backend/mdengineers
npm install
npm run dev
```

### Step 2: Authenticate
Get a JWT token by logging in:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Step 3: Test BMS Connection
```bash
curl -X GET http://localhost:8000/api/bms/test \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Step 4: Fetch Data from BMS
```bash
curl -X GET http://localhost:8000/api/bms/invoices \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Troubleshooting

### Connection Refused Error
- Ensure BMS API is running on `http://localhost:5000`
- Check `BMS_API_URL` environment variable

### Authentication Failed
- Verify API key and secret are correct
- Check that the BMS API is configured to accept requests with these credentials

### HMAC Signature Mismatch
- Ensure API secret matches exactly (check for leading/trailing spaces)
- Verify timestamp synchronization between servers

### Missing Data
- Check BMS API permissions for the API key
- Ensure tenant ID is correct for the data being requested

## Security Considerations

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** periodically
4. **Validate and sanitize** all user inputs before sending to BMS
5. **Use HTTPS** in production for all API communications
6. **Log sensitive operations** but never log full API credentials

## Future Enhancements

- [ ] Add webhook support for real-time BMS events
- [ ] Implement caching for frequently accessed data
- [ ] Add retry logic with exponential backoff
- [ ] Support for batch operations
- [ ] Advanced error recovery mechanisms
- [ ] Performance metrics and monitoring

## Support

For issues or questions regarding the BMS integration:
1. Check the error logs in `logs/` directory
2. Verify environment variables are set correctly
3. Test the BMS API directly to isolate issues
4. Contact BMS support team if API is returning errors
