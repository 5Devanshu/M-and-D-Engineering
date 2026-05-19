# BMS Integration Backend Documentation

## Overview
This document outlines the BMS (Billing Management System) integration in the M and D Engineering ERP backend. The integration allows M and D to create, view, edit, and send bills with automatic synchronization to BMS.

## Architecture

```
M and D Engineering Backend
├── Bills Module
│   ├── Controller (bills.controller.js)
│   ├── Service (bills.service.js)
│   ├── Routes (bills.routes.js)
│   └── Database (bills_migration.sql)
└── BMS Integration Service (bms.integration.service.js)
    └── Axios HTTP Client
        └── BMS API (http://localhost:3001)
```

## Features

### 1. Create Bills
- Create new bills with line items
- Automatically sync to BMS
- Track both local and BMS invoice IDs
- Support for customer details and due dates

### 2. View Bills
- Get all bills with pagination and filters
- Get specific bill with all line items
- View BMS sync status

### 3. Edit Bills
- Edit draft bills (not synced)
- Cannot edit synced bills
- Update items and amounts
- Re-calculate totals

### 4. Send/Sync Bills
- Sync unsync bills to BMS
- Get invoice details from BMS
- Track sync status

### 5. Masters Sync
- Sync particulars/items to BMS
- Keep inventory in sync
- Bulk sync support

## API Endpoints

### Bills Management

#### Create a Bill
```
POST /api/bills
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": "uuid",
  "items": [
    {
      "particular_id": "uuid",
      "quantity": 10,
      "rate": 500,
      "amount": 5000
    }
  ],
  "total_amount": 5000,
  "description": "Invoice for Project X",
  "due_date": "2026-05-31",
  "notes": "Payment terms: Net 30"
}

Response: 201 Created
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "id": "bill-uuid",
    "customer_id": "customer-uuid",
    "total_amount": 5000,
    "status": "synced",
    "bms_invoice_id": "bms-id",
    "bms_invoice_number": "INV-001",
    "items": [...],
    "created_at": "2026-05-19T10:30:00Z"
  }
}
```

#### Get All Bills
```
GET /api/bills?limit=20&offset=0&status=synced&customer_id=uuid
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Bills retrieved successfully",
  "data": [...],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "pages": 3
  }
}
```

#### Get Bill by ID
```
GET /api/bills/:billId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Bill retrieved successfully",
  "data": {
    "id": "bill-uuid",
    "customer_name": "ABC Company",
    "customer_email": "contact@abc.com",
    "total_amount": 5000,
    "status": "synced",
    "bms_invoice_id": "bms-id",
    "items": [
      {
        "id": "item-uuid",
        "particular_name": "Chemical X",
        "quantity": 10,
        "rate": 500,
        "amount": 5000
      }
    ],
    "created_at": "2026-05-19T10:30:00Z"
  }
}
```

#### Update Bill
```
PUT /api/bills/:billId
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": "uuid",
  "items": [...],
  "total_amount": 5500
}

Response: 200 OK
{
  "success": true,
  "message": "Bill updated successfully",
  "data": {...}
}

Note: Can only update draft bills (not synced)
```

#### Send Bill to BMS
```
POST /api/bills/:billId/send
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Bill sent to BMS successfully",
  "data": {
    "bill": {...},
    "bmsInvoice": {
      "id": "bms-id",
      "invoice_number": "INV-001",
      "status": "draft",
      "total_amount": 5000
    }
  }
}
```

#### Delete/Cancel Bill
```
DELETE /api/bills/:billId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Bill cancelled successfully",
  "data": {
    "id": "bill-uuid",
    "status": "cancelled"
  }
}
```

#### Sync Masters/Particulars
```
POST /api/bills/sync/masters
Content-Type: application/json
Authorization: Bearer <token>

{
  "particulars": [
    {
      "id": "particular-uuid",
      "name": "Chemical X",
      "hsn_code": "2811.19.90",
      "description": "Industrial Chemical",
      "unit": "kg",
      "tax_applicable": true
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "message": "Synced 1 masters successfully",
  "data": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "results": [
      {
        "success": true,
        "particular_id": "particular-uuid",
        "bms_id": "bms-particular-id"
      }
    ]
  }
}
```

## Database Schema

### Bills Table
```sql
CREATE TABLE bills (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  bms_invoice_id VARCHAR(100),
  bms_invoice_number VARCHAR(50),
  total_amount DECIMAL(12, 2),
  description TEXT,
  notes TEXT,
  due_date DATE,
  status VARCHAR(50), -- draft, synced, sent, paid, cancelled
  created_by UUID NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### Bill Items Table
```sql
CREATE TABLE bill_items (
  id UUID PRIMARY KEY,
  bill_id UUID NOT NULL,
  particular_id UUID NOT NULL,
  quantity DECIMAL(10, 2),
  rate DECIMAL(12, 2),
  amount DECIMAL(12, 2),
  created_at TIMESTAMP
);
```

### Bill Sync Log
```sql
CREATE TABLE bill_sync_log (
  id UUID PRIMARY KEY,
  bill_id UUID,
  action VARCHAR(50),
  status VARCHAR(50),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP
);
```

## Configuration

### Environment Variables
Add to your `.env` file:

```env
# BMS API Configuration
BMS_API_URL=http://localhost:3001
BMS_API_KEY=your_bms_api_key

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=mdengineers
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install axios
```

### 2. Create Database Tables
Run the migration file:
```bash
psql -U postgres -d mdengineers -f sql/bills_migration.sql
```

### 3. Update Environment Variables
Copy environment settings and update with your BMS URL and API key.

### 4. Start the Backend
```bash
npm run dev
```

### 5. Test the Integration
Use Postman or curl to test the endpoints:

```bash
# Create a bill
curl -X POST http://localhost:8000/api/bills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "...",
    "items": [...],
    "total_amount": 5000
  }'
```

## Workflow

### Normal Bill Creation Flow
1. **Create Bill** - User creates bill with items (status: draft)
2. **Auto-Sync** - Bill is automatically synced to BMS
3. **Track Status** - Bill status becomes "synced"
4. **Send Bill** - User sends bill to customer (optional)
5. **Track Payment** - Bill payment status is updated

### Error Handling
- If BMS sync fails, bill is saved as "draft"
- User can retry sending or edit and resend
- All sync attempts are logged in bill_sync_log table

## Integration Points

### With Stock Module
When a bill is created with items, the stock is automatically:
- Deducted from M&D inventory
- Synced to BMS stock

### With Masters Module
Particulars/Items can be synced to BMS:
- Create bulk sync endpoint
- Keep HSN codes in sync
- Maintain tax configurations

### With Customers Module
Customer data is synced when:
- Creating a bill with new customer
- Updating customer information
- Exporting customer lists to BMS

## Error Handling

### Common Errors

#### Customer Not Found
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "customer_id": "Customer not found"
  }
}
```

#### BMS API Unreachable
```json
{
  "success": false,
  "message": "Bill created successfully",
  "note": "BMS sync failed, bill saved as draft"
}
```

#### Cannot Edit Synced Bill
```json
{
  "success": false,
  "message": "Cannot edit synced bills. Please create a new bill."
}
```

## Monitoring

### Logging
All integrations are logged using Winston logger in `logs/` directory:
- `app.log` - General application logs
- `error.log` - Error logs
- `bms-integration.log` - BMS specific logs (optional)

### Sync Status Tracking
Check sync status via database:
```sql
SELECT * FROM bill_sync_log WHERE status = 'failed';
```

## Performance Considerations

### Optimization
1. **Indexes** - Created on frequently queried fields
2. **Pagination** - Default 20 items per page
3. **Connection Pooling** - Using database connection pool
4. **Async Operations** - All I/O operations are async

### Rate Limiting
- BMS API calls are rate limited to prevent abuse
- Implement retry logic with exponential backoff
- Queue system for bulk operations (optional)

## Future Enhancements

1. **Webhook Integration** - Receive updates from BMS in real-time
2. **Queue System** - Bull/RabbitMQ for reliable sync
3. **Advanced Filtering** - Filter bills by date range, amount, etc.
4. **Bill Templates** - Save custom bill formats
5. **Bulk Operations** - Bulk create/update bills
6. **Payment Integration** - Track payments in BMS
7. **Audit Trail** - Complete audit log of all changes
8. **Notifications** - Email/SMS notifications for bill events

## Troubleshooting

### BMS Connection Issues
```bash
# Check BMS health
curl http://localhost:3001/api/health

# Check logs
tail -f logs/error.log
```

### Database Issues
```bash
# Check database connection
psql -U postgres -d mdengineers -c "SELECT 1;"

# View sync logs
psql -U postgres -d mdengineers -c "SELECT * FROM bill_sync_log LIMIT 10;"
```

### Authentication Issues
```bash
# Verify JWT token
# Check token expiration in logs
grep "Token expired" logs/error.log
```

## Support
For issues or questions, contact: support@mdengineers.com

---

**Last Updated:** May 19, 2026
**Version:** 1.0.0
