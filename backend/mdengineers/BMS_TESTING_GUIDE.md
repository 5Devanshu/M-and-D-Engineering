# BMS Integration Testing Guide

## API Testing with Postman

### Setup Postman Collection

1. **Create Environment Variables**

In Postman, create a new environment with:

```json
{
  "base_url": "http://localhost:8000",
  "bms_url": "http://localhost:3001",
  "token": "",
  "customer_id": "",
  "bill_id": "",
  "particular_id": ""
}
```

### Test Cases

#### 1. Authentication

**Get Auth Token**

```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

Save token in `token` variable.

#### 2. Get Customers

**Find Existing Customer or Create One**

```
GET {{base_url}}/api/users?role=customer
Authorization: Bearer {{token}}
```

Save customer ID in `customer_id` variable.

#### 3. Get Particulars

**Find Existing Particulars**

```
GET {{base_url}}/api/masters/materials
Authorization: Bearer {{token}}
```

Save particular ID in `particular_id` variable.

#### 4. Create Bill (Happy Path)

```
POST {{base_url}}/api/bills
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "customer_id": "{{customer_id}}",
  "items": [
    {
      "particular_id": "{{particular_id}}",
      "quantity": 10,
      "rate": 500,
      "amount": 5000
    }
  ],
  "total_amount": 5000,
  "description": "Test Bill for Chemical Supply",
  "due_date": "2026-06-19",
  "notes": "Payment terms: Net 30"
}
```

**Expected Response:** 201 Created

```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "id": "uuid",
    "customer_id": "uuid",
    "total_amount": 5000,
    "status": "synced",
    "bms_invoice_id": "bms-uuid",
    "bms_invoice_number": "INV-001",
    "items": [...],
    "created_at": "2026-05-19T10:30:00Z"
  }
}
```

Save bill ID in `bill_id` variable.

#### 5. Get Bill Details

```
GET {{base_url}}/api/bills/{{bill_id}}
Authorization: Bearer {{token}}
```

**Expected:** 200 OK with bill details and items

#### 6. Get All Bills (with pagination)

```
GET {{base_url}}/api/bills?limit=20&offset=0&status=synced
Authorization: Bearer {{token}}
```

**Expected:** 200 OK with paginated response

#### 7. Update Bill

```
PUT {{base_url}}/api/bills/{{bill_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "total_amount": 5500,
  "notes": "Updated payment terms: Net 15"
}
```

**Note:** Can only update draft bills

#### 8. Send Bill to BMS

```
POST {{base_url}}/api/bills/{{bill_id}}/send
Authorization: Bearer {{token}}
```

**Expected:** 200 OK with bill and BMS invoice details

#### 9. Sync Masters to BMS

```
POST {{base_url}}/api/bills/sync/masters
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "particulars": [
    {
      "id": "{{particular_id}}",
      "name": "Chemical X",
      "hsn_code": "2811.19.90",
      "description": "Industrial Chemical",
      "unit": "kg",
      "tax_applicable": true,
      "tax_rate": 18
    }
  ]
}
```

#### 10. Delete Bill

```
DELETE {{base_url}}/api/bills/{{bill_id}}
Authorization: Bearer {{token}}
```

**Expected:** 200 OK with cancelled status

### Error Case Testing

#### Test 1: Missing Required Fields

```
POST {{base_url}}/api/bills
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "items": []
}
```

**Expected:** 422 Unprocessable Entity

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "customer_id": "Customer ID is required",
    "items": "At least one item is required"
  }
}
```

#### Test 2: Invalid Token

```
GET {{base_url}}/api/bills
Authorization: Bearer invalid_token
```

**Expected:** 401 Unauthorized

#### Test 3: Bill Not Found

```
GET {{base_url}}/api/bills/invalid-uuid
Authorization: Bearer {{token}}
```

**Expected:** 404 Not Found

#### Test 4: Edit Synced Bill

```
PUT {{base_url}}/api/bills/{{bill_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "total_amount": 6000
}
```

**Expected:** 400 Bad Request (Cannot edit synced bills)

#### Test 5: BMS Connection Failure

If BMS is down:

```
POST {{base_url}}/api/bills
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "customer_id": "{{customer_id}}",
  "items": [...]
}
```

**Expected:** 201 Created (bill saved as draft, BMS sync failed)

```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "status": "draft",
    "bms_invoice_id": null,
    "note": "BMS sync failed, bill saved locally"
  }
}
```

## Database Verification

### Check Bills Table

```sql
-- View all bills
SELECT * FROM bills;

-- View specific bill with items
SELECT b.*, COUNT(bi.id) as item_count
FROM bills b
LEFT JOIN bill_items bi ON b.id = bi.bill_id
GROUP BY b.id
ORDER BY b.created_at DESC;

-- Check sync status
SELECT id, status, bms_invoice_id, bms_invoice_number, created_at
FROM bills
WHERE status = 'synced';

-- Check failed syncs
SELECT id, status, created_at
FROM bills
WHERE status = 'draft' AND bms_invoice_id IS NULL;
```

### Check Bill Items

```sql
-- View bill items
SELECT bi.*, p.name as particular_name
FROM bill_items bi
LEFT JOIN particulars p ON bi.particular_id = p.id
WHERE bi.bill_id = '<bill-id>';

-- Check totals
SELECT bill_id, COUNT(*) as item_count, SUM(amount) as total_amount
FROM bill_items
GROUP BY bill_id;
```

### Check Sync Logs

```sql
-- View all sync attempts
SELECT * FROM bill_sync_log ORDER BY created_at DESC;

-- Check failed syncs
SELECT * FROM bill_sync_log WHERE status = 'failed';

-- View error details
SELECT id, bill_id, error_message, created_at
FROM bill_sync_log
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

## Load Testing

### Bulk Create Bills

Use Artillery or Apache Bench to test:

```yaml
# artillery-config.yml
config:
  target: "http://localhost:8000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Ramp up"

scenarios:
  - name: "Create Bills"
    flow:
      - post:
          url: "/api/bills"
          headers:
            Authorization: "Bearer {{token}}"
          json:
            customer_id: "{{customer_id}}"
            items:
              - particular_id: "{{particular_id}}"
                quantity: 10
                rate: 500
                amount: 5000
            total_amount: 5000
```

Run: `artillery run artillery-config.yml`

## Performance Metrics

### Response Times

Expected response times:

- Create Bill: < 500ms (with BMS sync)
- Get Bill: < 100ms
- Get All Bills: < 200ms (with pagination)
- Update Bill: < 300ms
- Sync Masters: < 1000ms (per item)

### Database Metrics

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT b.*, c.name
FROM bills b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE b.status = 'synced'
ORDER BY b.created_at DESC
LIMIT 20;
```

## Continuous Testing

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

API_URL="http://localhost:8000"
BMS_URL="http://localhost:3001"

echo "🔍 Checking M&D Backend..."
curl -s "$API_URL/api/health" | jq .

echo "🔍 Checking BMS Backend..."
curl -s "$BMS_URL/api/health" | jq .

echo "✅ Health check complete"
```

Run: `bash health-check.sh`

### Test Automation Script

```bash
#!/bin/bash
# test-integration.sh

TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# Test create bill
curl -X POST http://localhost:8000/api/bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "...",
    "items": [...],
    "total_amount": 5000
  }' | jq .

echo "✅ Tests completed"
```

## Monitoring

### Log Files

```bash
# Watch error logs
tail -f logs/error.log

# Watch BMS integration logs
grep "BMS Integration" logs/app.log

# Count sync failures
grep "Failed to create bill in BMS" logs/error.log | wc -l
```

### Dashboard Metrics

Create a monitoring dashboard with:

1. **Bill Creation Rate** - Bills created per minute
2. **BMS Sync Success Rate** - % of bills successfully synced
3. **Average Response Time** - API response times
4. **Error Rate** - % of failed requests
5. **Database Query Performance** - Query execution times

## Common Test Scenarios

### Scenario 1: Normal Workflow
1. Create bill → Verify synced to BMS ✓
2. View bill → Verify details match ✓
3. Send bill → Verify BMS invoice created ✓

### Scenario 2: Retry on BMS Failure
1. BMS offline → Create bill (draft status) ✓
2. Turn on BMS
3. Send bill → Verify synced ✓

### Scenario 3: Bulk Operations
1. Create 100 bills → Verify all synced ✓
2. Sync 50 masters → Check success rate ✓
3. Monitor performance ✓

### Scenario 4: Concurrency
1. Multiple users create bills simultaneously
2. Verify no data corruption
3. Check sync consistency

## Regression Testing

Before deployment, test:

- [ ] Create bill without BMS sync
- [ ] Create bill with BMS sync
- [ ] Update draft bill
- [ ] Update synced bill (should fail)
- [ ] Send draft bill to BMS
- [ ] Send synced bill to BMS
- [ ] Delete bill
- [ ] Get bill details
- [ ] Get paginated bills
- [ ] Sync masters
- [ ] Test with invalid inputs
- [ ] Test authentication
- [ ] Test authorization
- [ ] Test database constraints
- [ ] Test error handling

---

**Version:** 1.0.0  
**Last Updated:** May 19, 2026
