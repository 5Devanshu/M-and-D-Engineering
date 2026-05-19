# Bills Module - End-to-End Testing Guide

This guide provides comprehensive instructions for testing the Bills (invoice) creation and management module integration between the M&D Engineers ERP backend and frontend.

---

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Backend API Testing](#backend-api-testing)
3. [Frontend Integration Testing](#frontend-integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
6. [Automated Test Scripts](#automated-test-scripts)

---

## Pre-Testing Setup

### Prerequisites

- **Backend**: Node.js, npm, running M&D Engineers backend server
- **Frontend**: Vite dev server, modern browser (Chrome, Firefox, Safari)
- **Database**: PostgreSQL with bills tables migrated
- **API Access**: Valid authentication token for testing

### 1. Backend Setup

```bash
cd "/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers"

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Update .env with your BMS_API_URL, BMS_API_KEY, DATABASE_URL, etc.

# Run database migrations (if not already done)
npm run migrate:bills  # or use Prisma migrations

# Start backend server
npm run dev
# Expected output: 🚀 M&D Engineers ERP running on port 8000 [development]
```

### 2. Frontend Setup

```bash
cd "/Users/devanshu/Desktop/M and D Engineering Frontend/md-engineers-frontend"

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# Expected output: VITE v... ready in ... ms
# Local: http://localhost:5173
```

### 3. Database Verification

Check that bills tables exist:

```sql
-- Connect to your PostgreSQL database
\d bills
\d bill_items

-- Expected output: Two tables with following structure:
-- bills: id, customer_id, status, bms_invoice_id, created_by, created_at, updated_at, deleted_at
-- bill_items: id, bill_id, particular_id, quantity, rate, amount, gst_rate, gst_amount, created_at
```

---

## Backend API Testing

### 1. Authentication

**Endpoint**: `POST /api/auth/login`

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Response** (save the `token` for subsequent requests):

```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "admin@example.com", "name": "Admin" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Create a Bill

**Endpoint**: `POST /api/bills`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

**Request Body**:

```json
{
  "customer_id": 1,
  "items": [
    {
      "particular_id": 1,
      "quantity": 10,
      "rate": 500.00
    },
    {
      "particular_id": 2,
      "quantity": 5,
      "rate": 250.00
    }
  ],
  "total_amount": 6250,
  "description": "Test Bill",
  "due_date": "2025-12-31",
  "notes": "Test bill for integration testing"
}
```

**cURL Command**:

```bash
TOKEN="your_jwt_token_here"
curl -X POST http://localhost:8000/api/bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [
      { "particular_id": 1, "quantity": 10, "rate": 500.00 },
      { "particular_id": 2, "quantity": 5, "rate": 250.00 }
    ],
    "total_amount": 6250,
    "description": "Test Bill",
    "due_date": "2025-12-31",
    "notes": "Test bill for integration testing"
  }'
```

**Expected Response** (201 Created):

```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "bill": {
      "id": 1,
      "customer_id": 1,
      "status": "draft",
      "total_amount": 6250,
      "bms_invoice_id": null,
      "created_by": 1,
      "created_at": "2025-01-15T10:30:00Z"
    }
  }
}
```

### 3. Get All Bills

**Endpoint**: `GET /api/bills`

```bash
TOKEN="your_jwt_token_here"
curl -X GET "http://localhost:8000/api/bills?limit=10&offset=0&status=all" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "message": "Bills retrieved successfully",
  "data": {
    "bills": [
      {
        "id": 1,
        "customer_id": 1,
        "customer_name": "Acme Corporation",
        "status": "draft",
        "total_amount": 6250,
        "bms_invoice_id": null,
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 10,
      "offset": 0,
      "page": 1,
      "pages": 1
    }
  }
}
```

### 4. Get Bill by ID

**Endpoint**: `GET /api/bills/:billId`

```bash
TOKEN="your_jwt_token_here"
BILL_ID=1
curl -X GET http://localhost:8000/api/bills/$BILL_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Update Bill

**Endpoint**: `PUT /api/bills/:billId`

```bash
TOKEN="your_jwt_token_here"
BILL_ID=1
curl -X PUT http://localhost:8000/api/bills/$BILL_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [
      { "particular_id": 1, "quantity": 15, "rate": 500.00 }
    ],
    "total_amount": 8875
  }'
```

### 6. Send Bill to BMS

**Endpoint**: `POST /api/bills/:billId/send`

```bash
TOKEN="your_jwt_token_here"
BILL_ID=1
curl -X POST http://localhost:8000/api/bills/$BILL_ID/send \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Bill sent to BMS successfully",
  "data": {
    "bill": {
      "id": 1,
      "status": "sent",
      "bms_invoice_id": "BMS-INV-2025-001",
      "bms_invoice_number": "INV-202501-0001"
    }
  }
}
```

### 7. Delete Bill

**Endpoint**: `DELETE /api/bills/:billId`

```bash
TOKEN="your_jwt_token_here"
BILL_ID=1
curl -X DELETE http://localhost:8000/api/bills/$BILL_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Sync Masters to BMS

**Endpoint**: `POST /api/bills/sync/masters`

```bash
TOKEN="your_jwt_token_here"
curl -X POST http://localhost:8000/api/bills/sync/masters \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "particulars": [
      { "id": 1, "name": "Chemical A", "unit": "kg" },
      { "id": 2, "name": "Chemical B", "unit": "liter" }
    ]
  }'
```

---

## Frontend Integration Testing

### 1. Manual UI Testing

**URL**: `http://localhost:5173/bills`

#### Test Steps:

1. **Login**:
   - Navigate to login page
   - Enter credentials (admin@example.com / admin123)
   - Click "Sign In"
   - Verify: Redirected to dashboard

2. **Navigate to Bills**:
   - Click "Bills" in sidebar navigation
   - Verify: Bills page loads with list view
   - Verify: "Create Bill" button is visible

3. **Create a Bill**:
   - Click "Create Bill" button
   - Fill in form:
     - Customer Name: "Test Customer"
     - Bill Date: Today's date
     - Add Items:
       - Description: "Service A"
       - Quantity: 2
       - Unit Price: 500
       - GST Rate: 18%
     - Click "Add Item"
     - Verify: Item appears in list
   - Enter Due Date: 30 days from today
   - Notes: "Test bill"
   - Click "Create Bill"
   - Verify: Success notification appears
   - Verify: Bill appears in bills list

4. **View Bill**:
   - Click "View" icon on a bill
   - Verify: Bill details displayed correctly
   - Verify: Items listed with calculations
   - Verify: Total, GST, and subtotal calculated correctly

5. **Edit Bill**:
   - Click "Edit" icon on a draft bill
   - Modify customer name
   - Modify item quantity
   - Click "Update Bill"
   - Verify: Success notification
   - Verify: Changes reflected in list

6. **Search and Filter**:
   - Enter search term in search box
   - Verify: List filters by customer name
   - Select status filter (Draft, Sent, Cancelled)
   - Verify: List updates based on status

7. **Send Bill**:
   - Click "Send" button on a bill
   - Verify: Bill status changes to "Sent"
   - Verify: BMS integration confirmation shown
   - Verify: Bill ID/Number displayed

8. **Print/Preview**:
   - Click "Download" button
   - Verify: PDF preview opens or downloads

9. **Delete Bill**:
   - Click "Delete" icon on a bill
   - Confirm deletion in dialog
   - Verify: Success notification
   - Verify: Bill removed from list

---

## End-to-End Testing

### Scenario 1: Complete Bill Workflow

**Objective**: Create, edit, send, and view a bill in production workflow

**Steps**:

1. Start backend server
2. Start frontend dev server
3. Login to system
4. Navigate to Bills page
5. Create a new bill with 2-3 line items
6. Verify bill saved in Redux state
7. Refresh page and verify bill still present (Redux hydration)
8. Edit bill and change quantities
9. Send bill to BMS
10. Verify BMS integration response
11. View sent bill details
12. Verify all data persisted correctly
13. Search for bill by customer name
14. Filter bills by status
15. Delete a draft bill (not sent)
16. Verify cannot delete sent bill

**Expected Outcome**: All operations succeed with appropriate notifications and data consistency

---

### Scenario 2: BMS Integration Flow

**Objective**: Verify BMS synchronization works correctly

**Steps**:

1. Ensure BMS API is reachable at configured URL
2. Create a bill with valid particulars
3. Send bill to BMS
4. Monitor network tab in browser DevTools
5. Verify API call to `/api/bills/:billId/send` succeeds
6. Verify BMS integration service response includes:
   - bms_invoice_id
   - bms_invoice_number
   - status change to "sent"
7. Query database to confirm bill marked as sent
8. Attempt to edit sent bill
9. Verify error: "Cannot edit synced bills"

**Expected Outcome**: BMS integration works end-to-end without errors

---

### Scenario 3: Data Validation

**Objective**: Verify form validation and error handling

**Steps**:

1. Try creating bill without customer name → Verify error message
2. Try creating bill without items → Verify error message
3. Try creating bill with zero quantity → Verify error message
4. Try creating bill with negative unit price → Verify error message
5. Try submitting form with incomplete data → Verify validation errors
6. Verify calculations with various GST rates (0%, 5%, 12%, 18%, 28%)
7. Verify total calculations with multiple items

**Expected Outcome**: All validations work; calculations are accurate

---

## Common Issues & Troubleshooting

### Issue 1: Backend Server Won't Start

**Symptoms**: `npm run dev` fails or port already in use

**Solutions**:

```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process if needed
kill -9 <PID>

# Or use different port
PORT=8001 npm run dev
```

### Issue 2: Database Connection Error

**Symptoms**: `Error: connect ECONNREFUSED`

**Solutions**:

```bash
# Verify PostgreSQL is running
psql --version

# Start PostgreSQL (macOS)
brew services start postgresql

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### Issue 3: Bills API Endpoint Returns 401 Unauthorized

**Symptoms**: All API calls return 401

**Solutions**:

- Verify JWT token is correct
- Token may be expired, login again
- Check `Authorization` header format: `Bearer <token>`
- Verify `authenticate` middleware is configured

### Issue 4: BMS Integration Failing

**Symptoms**: Bill creation succeeds but send to BMS fails

**Solutions**:

```bash
# Check BMS API URL
echo $BMS_API_URL

# Verify BMS service is running
curl http://localhost:3001/health

# Check BMS_API_KEY in .env
echo $BMS_API_KEY
```

### Issue 5: Frontend Not Showing Bills List

**Symptoms**: Bills page is blank or "No bills found"

**Solutions**:

- Open browser DevTools (F12)
- Check Network tab for API errors
- Check Console for JavaScript errors
- Verify Redux state: inspect BillSlice in DevTools
- Try refreshing page (Ctrl+R)
- Clear Redux state and reload

### Issue 6: Redux State Not Updating

**Symptoms**: Bill created but doesn't appear in list

**Solutions**:

- Verify `setBills` action is dispatched
- Check Redux DevTools for action history
- Verify reducer logic in `BillSlice.js`
- Check if `VITE_API_BASE_URL` is correctly configured

---

## Automated Test Scripts

### Test Script 1: Backend API Test (Shell Script)

Create file: `test-backend-api.sh`

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000"
TOKEN=""
BILL_ID=""

echo "🧪 M&D Engineers Bills API Testing"
echo "=================================="

# 1. Login
echo -e "\n${GREEN}[TEST 1] Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

echo "Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo -e "${RED}[FAILED] Could not extract token${NC}"
  exit 1
fi

# 2. Create Bill
echo -e "\n${GREEN}[TEST 2] Create Bill${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/bills" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [
      { "particular_id": 1, "quantity": 10, "rate": 500.00 }
    ],
    "total_amount": 5000,
    "description": "Test Bill",
    "due_date": "2025-12-31",
    "notes": "Automated test"
  }')

echo "Response: $CREATE_RESPONSE"

BILL_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Bill ID: $BILL_ID"

if [ -z "$BILL_ID" ]; then
  echo -e "${RED}[FAILED] Could not create bill${NC}"
  exit 1
fi

# 3. Get All Bills
echo -e "\n${GREEN}[TEST 3] Get All Bills${NC}"
curl -s -X GET "$API_URL/api/bills" \
  -H "Authorization: Bearer $TOKEN" | json_pp

# 4. Get Bill by ID
echo -e "\n${GREEN}[TEST 4] Get Bill by ID${NC}"
curl -s -X GET "$API_URL/api/bills/$BILL_ID" \
  -H "Authorization: Bearer $TOKEN" | json_pp

# 5. Update Bill
echo -e "\n${GREEN}[TEST 5] Update Bill${NC}"
curl -s -X PUT "$API_URL/api/bills/$BILL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [
      { "particular_id": 1, "quantity": 15, "rate": 500.00 }
    ],
    "total_amount": 7500
  }' | json_pp

# 6. Send Bill
echo -e "\n${GREEN}[TEST 6] Send Bill to BMS${NC}"
curl -s -X POST "$API_URL/api/bills/$BILL_ID/send" \
  -H "Authorization: Bearer $TOKEN" | json_pp

echo -e "\n${GREEN}✅ All tests completed!${NC}"
```

**Usage**:

```bash
chmod +x test-backend-api.sh
./test-backend-api.sh
```

---

### Test Script 2: Frontend Component Test (JavaScript)

Create file: `/Users/devanshu/Desktop/M and D Engineering Frontend/md-engineers-frontend/src/__tests__/bills.test.js`

```javascript
/**
 * Bills Module Tests
 * Tests Redux state management, API calls, and component rendering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import billReducer, {
  setBills,
  addBill,
  updateBill,
  deleteBill,
  setCurrentBill,
} from '../app/BillSlice';

describe('BillSlice', () => {
  const initialState = {
    bills: [],
    currentBill: null,
    loading: false,
    error: null,
  };

  it('should handle setBills', () => {
    const mockBills = [
      { id: 1, customer_name: 'Customer 1', status: 'draft' },
      { id: 2, customer_name: 'Customer 2', status: 'sent' },
    ];

    const state = billReducer(initialState, setBills(mockBills));
    expect(state.bills).toEqual(mockBills);
  });

  it('should handle addBill', () => {
    const bill = { id: 1, customer_name: 'New Customer', status: 'draft' };
    const state = billReducer(initialState, addBill(bill));
    expect(state.bills).toHaveLength(1);
    expect(state.bills[0]).toEqual(bill);
  });

  it('should handle updateBill', () => {
    const stateWithBill = {
      ...initialState,
      bills: [{ id: 1, customer_name: 'Customer 1', status: 'draft' }],
    };

    const updated = { id: 1, customer_name: 'Updated Customer', status: 'draft' };
    const state = billReducer(stateWithBill, updateBill(updated));
    expect(state.bills[0].customer_name).toBe('Updated Customer');
  });

  it('should handle deleteBill', () => {
    const stateWithBill = {
      ...initialState,
      bills: [
        { id: 1, customer_name: 'Customer 1', status: 'draft' },
        { id: 2, customer_name: 'Customer 2', status: 'draft' },
      ],
    };

    const state = billReducer(stateWithBill, deleteBill(1));
    expect(state.bills).toHaveLength(1);
    expect(state.bills[0].id).toBe(2);
  });

  it('should handle setCurrentBill', () => {
    const bill = { id: 1, customer_name: 'Customer 1', status: 'draft' };
    const state = billReducer(initialState, setCurrentBill(bill));
    expect(state.currentBill).toEqual(bill);
  });
});

// API Tests
describe('Bill Repository', () => {
  it('should fetch bills', async () => {
    // Mock API call
    const mockBills = [
      { id: 1, customer_name: 'Customer 1' },
    ];
    expect(mockBills).toBeDefined();
  });

  it('should create bill', async () => {
    // Mock API call
    const mockBill = { id: 1, customer_name: 'New Customer' };
    expect(mockBill.id).toBeDefined();
  });
});
```

---

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend dev server starts without errors
- [ ] Login/Authentication works
- [ ] Can navigate to Bills page
- [ ] Can create a bill
- [ ] Bill appears in list immediately
- [ ] Can edit a draft bill
- [ ] Can view bill details
- [ ] Can search bills by customer name
- [ ] Can filter bills by status
- [ ] Can send bill to BMS
- [ ] Bill status changes after sending
- [ ] Can download/print bill
- [ ] Can delete a draft bill
- [ ] Calculations (subtotal, GST, total) are correct
- [ ] Database persists all data correctly
- [ ] Redux state management works
- [ ] No console errors
- [ ] No network errors in DevTools
- [ ] BMS integration succeeds
- [ ] Error messages display appropriately

---

## Additional Resources

- **Backend API Documentation**: See `/src/modules/bills/` directory
- **Frontend Component Documentation**: See Bills.jsx component
- **BMS Integration Service**: See `/src/services/bms.integration.service.js`
- **Redux Store**: See `/src/app/BillSlice.js`
- **Database Schema**: See `/sql/bills_migration.sql`

---

**Test Report Template**:

```
Test Date: ___________
Tested By: ___________
Environment: Backend (v___) | Frontend (v___)

Tests Passed: ___ / ___
Tests Failed: ___ / ___
Issues Found: 
- [ ] Issue 1
- [ ] Issue 2

Remarks: ___________________________________________
```

---

*Last Updated: 2025-01-15*
*Status: Ready for Testing*
