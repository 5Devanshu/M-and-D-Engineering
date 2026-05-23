# BMS Integration - Quick Reference Card

## 🔐 Credentials

```
API Key:    2ddfda4cc80bcd0835a102192d72deda5b5e3a52ba6cd17e850d618a95a3d097
API Secret: 02d1f36d16806e5638d16b068ffec439efc1895b9c9595902cfec7debd4541168c16f3676a05474771c3937171b58f4cafaa112abb31bbe398e4bd5c53005776
API URL:    http://localhost:5000/api
```

## 📍 Endpoints Base Path
```
/api/bms/
```

## ✅ Available Operations

### Test Connection
```
GET /api/bms/test
```
Returns: API health status

### Invoices
```
GET    /api/bms/invoices                      # List all
GET    /api/bms/invoices/:invoiceId          # Get one
POST   /api/bms/invoices                      # Create
```

### Clients  
```
GET    /api/bms/clients                       # List all
POST   /api/bms/clients                       # Create
```

### Payments
```
GET    /api/bms/payments                      # List all
POST   /api/bms/payments                      # Record
```

### Reference Data
```
GET    /api/bms/billing-particulars          # Get items
GET    /api/bms/tax-rates                     # Get rates
```

## 🔑 Authentication Header
```
Authorization: Bearer <your_jwt_token>
```

## 💻 Quick Usage

### Test Connection
```bash
curl http://localhost:8000/api/bms/test \
  -H "Authorization: Bearer TOKEN"
```

### Get Invoices
```bash
curl http://localhost:8000/api/bms/invoices \
  -H "Authorization: Bearer TOKEN"
```

### Create Client
```bash
curl -X POST http://localhost:8000/api/bms/clients \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_code": "CLI001",
    "client_name": "Company Name",
    "email": "company@example.com",
    "phone": "1234567890"
  }'
```

## 📁 Files Structure

```
src/
├── config/
│   └── env.js                    # Configuration
├── services/
│   └── bmsApi.service.js         # Core service
├── controllers/
│   └── bmsIntegration.controller.js
├── routes/
│   ├── index.js                  # Routes aggregator
│   └── bmsIntegration.routes.js  # BMS routes
.env.example                       # Environment template
```

## 🛠️ Setup Commands

```bash
# Navigate to project
cd "/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers"

# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on: http://localhost:8000
```

## 🔍 Response Format

All responses follow this format:
```json
{
  "statusCode": 200,
  "data": {
    // Response data here
  },
  "message": "Success message"
}
```

## ❌ Common Error Responses

```json
{
  "statusCode": 401,
  "message": "Unauthorized - JWT token invalid"
}
```

```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

## 📊 Query Parameters

Common filters across endpoints:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term
- `status` - Filter by status
- `is_active` - Filter by active/inactive

Example:
```
GET /api/bms/invoices?page=1&limit=20&status=paid
```

## 🔐 Security

✅ HMAC-SHA256 signing
✅ JWT authentication
✅ API key validation
✅ Timestamp verification
✅ Request logging

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure BMS runs on port 5000 |
| 401 Unauthorized | Get valid JWT token first |
| 403 Forbidden | Check API key and secret |
| HMAC mismatch | Verify API secret exactly |
| Timeout | Check network connectivity |

## 📚 Full Documentation

- Detailed guide: `BMS_INTEGRATION_GUIDE.md`
- Setup checklist: `BMS_INTEGRATION_SETUP.md`
- Architecture details: `INTEGRATION_SUMMARY.md`

## 🚀 Example: Full Workflow

```javascript
// 1. Get JWT Token
const auth = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'pass' })
});
const { data: { token } } = await auth.json();

// 2. Create Client in BMS
const client = await fetch('http://localhost:8000/api/bms/clients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    client_code: 'CLI001',
    client_name: 'My Client',
    email: 'client@example.com'
  })
});

// 3. Get Invoices
const invoices = await fetch('http://localhost:8000/api/bms/invoices', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 4. Record Payment
const payment = await fetch('http://localhost:8000/api/bms/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    invoice_id: 123,
    amount: 5000,
    payment_date: '2024-05-23'
  })
});
```

---

**Last Updated:** May 23, 2026
**Status:** ✅ Ready to Use
