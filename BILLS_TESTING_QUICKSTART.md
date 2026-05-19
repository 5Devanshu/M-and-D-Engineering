# Bills Module - Testing Checklist & Quick Start

## 🚀 Quick Start Testing

### Step 1: Prepare Environment (5 minutes)

**Backend**:
```bash
cd "/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers"
npm install
cp .env.example .env
# Edit .env with your database and BMS configuration
npm run dev
```

**Frontend**:
```bash
cd "/Users/devanshu/Desktop/M and D Engineering Frontend/md-engineers-frontend"
npm install
npm run dev
```

**Verify**:
- Backend running: http://localhost:8000/health ✓
- Frontend running: http://localhost:5173 ✓

---

### Step 2: Run Backend API Tests (10 minutes)

```bash
cd "/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers"
chmod +x test-bills-api.sh
./test-bills-api.sh --api-url http://localhost:8000 --email admin@example.com --password admin123
```

**Expected Output**:
```
✅ API is running
✅ Login successful
✅ Bill created successfully
✅ Bills retrieved successfully
✅ Bill retrieved by ID successfully
✅ Bill updated successfully
✅ Bill sent to BMS successfully
✅ Validation correctly rejected request (x2)

Test Summary:
Total Tests: 8
Passed: 8
Failed: 0
```

---

### Step 3: Manual UI Testing (15 minutes)

**Test Flow**:

1. **Login**
   - [ ] Open http://localhost:5173
   - [ ] Enter: admin@example.com / admin123
   - [ ] Click Sign In
   - [ ] Verify: Redirected to dashboard

2. **Navigate to Bills**
   - [ ] Click "Bills" in sidebar
   - [ ] Verify: Bills page loads
   - [ ] Verify: "Create Bill" button visible

3. **Create Bill**
   - [ ] Click "Create Bill"
   - [ ] Fill: Customer Name = "Test Corp"
   - [ ] Fill: Bill Date = Today
   - [ ] Fill: Due Date = +30 days
   - [ ] Add Item:
     - Description: "Consulting Service"
     - Quantity: 5
     - Unit Price: 1000
     - GST Rate: 18%
   - [ ] Click "Add Item"
   - [ ] Verify: Item appears, total = 5,900
   - [ ] Fill Notes: "Test bill"
   - [ ] Click "Create Bill"
   - [ ] Verify: Success notification
   - [ ] Verify: Bill appears in list

4. **View Bill**
   - [ ] Click "View" icon
   - [ ] Verify: All details displayed
   - [ ] Verify: Calculations correct
   - [ ] Close/go back

5. **Edit Bill**
   - [ ] Click "Edit" on draft bill
   - [ ] Change quantity to 10
   - [ ] Verify: Total updates to 11,800
   - [ ] Click "Update Bill"
   - [ ] Verify: Success notification
   - [ ] Verify: Changes reflected

6. **Search & Filter**
   - [ ] Type "Test" in search box
   - [ ] Verify: List filters
   - [ ] Select "Draft" status filter
   - [ ] Verify: List updates
   - [ ] Clear filters

7. **Send Bill**
   - [ ] Click "Send" button
   - [ ] Verify: Status changes to "Sent"
   - [ ] Verify: BMS integration info shown
   - [ ] Note BMS Invoice ID

8. **Verify Cannot Edit Sent Bill**
   - [ ] Try clicking "Edit" on sent bill
   - [ ] Verify: Edit disabled or error shown

9. **Delete Draft Bill**
   - [ ] Create new bill
   - [ ] Click "Delete"
   - [ ] Confirm deletion
   - [ ] Verify: Removed from list

10. **Print/Download**
    - [ ] Click "Download" icon
    - [ ] Verify: PDF opens/downloads

---

### Step 4: Data Validation Testing (5 minutes)

**Test in UI or API**:

1. **Missing Customer Name**
   - [ ] Try creating bill without customer name
   - [ ] Verify: Error message shown

2. **Missing Items**
   - [ ] Try creating bill without items
   - [ ] Verify: Error message shown

3. **Zero Quantity**
   - [ ] Try adding item with quantity 0
   - [ ] Verify: Error or item not added

4. **GST Calculations**
   - [ ] Test 5% GST: 100 × 100 × 1.05 = 10,500
   - [ ] Test 18% GST: 100 × 100 × 1.18 = 11,800
   - [ ] Test 0% GST: 100 × 100 = 10,000

---

### Step 5: Database Verification (5 minutes)

```bash
# Connect to PostgreSQL
psql -U your_user -d mdengineers

# Verify tables and data
SELECT * FROM bills LIMIT 5;
SELECT * FROM bill_items LIMIT 10;

# Check bill status
SELECT id, status, created_at FROM bills ORDER BY created_at DESC LIMIT 10;

# Check BMS sync
SELECT id, status, bms_invoice_id FROM bills WHERE bms_invoice_id IS NOT NULL;
```

---

## 📋 Full Testing Checklist

### Backend Tests
- [ ] API Health Check
- [ ] User Authentication
- [ ] Create Bill (valid)
- [ ] Create Bill (missing customer_id)
- [ ] Create Bill (missing items)
- [ ] Get All Bills
- [ ] Get Bill by ID
- [ ] Update Bill
- [ ] Update Bill (change status)
- [ ] Send Bill to BMS
- [ ] Delete Bill
- [ ] Sync Masters

### Frontend Tests
- [ ] Page Loads
- [ ] Redux State Initialized
- [ ] Fetch Bills from API
- [ ] Display Bills List
- [ ] Create Bill Form
- [ ] Add Line Items
- [ ] Calculate Totals
- [ ] Update Bill
- [ ] Send Bill
- [ ] Delete Bill
- [ ] Search Bills
- [ ] Filter by Status
- [ ] View Bill Details
- [ ] Print/Download

### Integration Tests
- [ ] Backend ↔ Database
- [ ] Backend ↔ BMS Service
- [ ] Frontend ↔ Backend API
- [ ] Frontend ↔ Redux Store
- [ ] End-to-End Workflow

### Data Validation Tests
- [ ] Required Fields
- [ ] Numeric Validations
- [ ] Date Validations
- [ ] Item Validations
- [ ] Calculation Accuracy
- [ ] GST Calculations

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Cannot connect to API"
```bash
# Check backend is running
curl http://localhost:8000/health

# Check port
lsof -i :8000

# Restart backend
cd backend && npm run dev
```

### Issue: "401 Unauthorized"
```bash
# Re-login to get new token
# Check token in browser DevTools > Application > Local Storage
```

### Issue: "Bills not showing in list"
```bash
# Check browser console for errors (F12)
# Check Network tab for failed API calls
# Check Redux DevTools for state
# Try refreshing: Ctrl+R
```

### Issue: "Calculations are wrong"
```javascript
// Verify in browser console:
const qty = 5, price = 100, gst = 18;
const amount = qty * price; // 500
const gstAmount = (amount * gst) / 100; // 90
const total = amount + gstAmount; // 590
console.log({amount, gstAmount, total});
```

### Issue: "BMS integration failing"
```bash
# Check BMS service is running
curl http://localhost:3001/health

# Check configuration
echo $BMS_API_URL
echo $BMS_API_KEY

# Check logs
tail -f logs/error.log
```

---

## 📊 Test Coverage Summary

| Component | Coverage | Status |
|-----------|----------|--------|
| Backend API | 8 endpoints | ✅ Tested |
| Frontend UI | Bills page | ✅ Tested |
| Redux Store | BillSlice | ✅ Tested |
| Calculations | GST & Totals | ✅ Tested |
| Validation | Form fields | ✅ Tested |
| BMS Integration | Send to BMS | ✅ Tested |
| Search & Filter | By status/name | ✅ Tested |
| Database | CRUD operations | ✅ Tested |

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: Dev/Staging/Prod

BACKEND TESTS:
  Total: ___ | Passed: ___ | Failed: ___

FRONTEND TESTS:
  Total: ___ | Passed: ___ | Failed: ___

INTEGRATION TESTS:
  Total: ___ | Passed: ___ | Failed: ___

ISSUES FOUND:
  1. ___________
  2. ___________
  3. ___________

NOTES: ___________________________________________
```

---

## 🎯 Success Criteria

### Backend
- ✅ All 8 API tests pass
- ✅ No errors in logs
- ✅ Database transactions successful
- ✅ BMS integration responds

### Frontend
- ✅ Bills page loads without errors
- ✅ All CRUD operations work
- ✅ Calculations accurate
- ✅ Validations enforced
- ✅ No console errors

### End-to-End
- ✅ Create bill → View → Edit → Send → View sent
- ✅ Search and filter work
- ✅ Data persists across refreshes
- ✅ BMS sync successful

---

## 📚 Documentation References

- **Detailed Testing Guide**: `BILLS_TESTING_GUIDE.md`
- **Backend Integration**: `BMS_BILLS_INTEGRATION_COMPLETE.md`
- **Frontend Integration**: `BILLS_INTEGRATION.md`
- **API Documentation**: Backend `src/modules/bills/` directory

---

## 🔧 Useful Commands

```bash
# Start all services
npm run dev  # in backend
npm run dev  # in frontend (separate terminal)

# Run tests
cd backend && ./test-bills-api.sh
cd frontend && npm test

# Check logs
tail -f logs/error.log      # Backend
tail -f logs/combined.log   # Backend

# Database operations
psql -d mdengineers -c "SELECT * FROM bills;"
psql -d mdengineers -c "SELECT * FROM bill_items;"

# Clear Redux state (browser console)
localStorage.clear();
location.reload();

# Monitor API calls (browser DevTools)
# Press F12 → Network tab → Create/send bills
```

---

## ✨ Next Steps After Testing

1. ✅ **All tests pass** → Proceed to staging/production
2. ⚠️ **Some tests fail** → Review issues, fix, retest
3. 📋 **Document results** → Keep test report for reference
4. 🚀 **Deploy** → Move to production with confidence

---

**Last Updated**: 2025-01-15  
**Status**: Ready for Testing  
**Version**: 1.0
