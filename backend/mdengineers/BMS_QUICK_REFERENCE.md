# BMS Backend Integration - Quick Reference

## 🚀 Quick Start (5 Minutes)

### Install
```bash
cd /Users/devanshu/Desktop/M\ and\ D\ Engineering/backend/mdengineers
npm install
```

### Configure
Create `.env` with BMS settings:
```env
BMS_API_URL=http://localhost:3001
BMS_API_KEY=your_key
DB_HOST=localhost
DB_NAME=mdengineers
```

### Setup Database
```bash
psql -U postgres -d mdengineers -f sql/bills_migration.sql
```

### Run
```bash
npm run dev
```

---

## 📚 File Structure

```
Backend Integration Files:
├── src/services/bms.integration.service.js (NEW)
├── src/modules/bills/ (NEW)
│   ├── bills.controller.js
│   ├── bills.service.js
│   ├── bills.routes.js
│   └── bills.validation.js
├── src/routes.js (UPDATED - added bills route)
├── sql/bills_migration.sql (NEW)
├── docs/BMS_INTEGRATION.md (NEW)
├── .env.example.bms (NEW)
├── BMS_BACKEND_SETUP.md (NEW)
├── BMS_TESTING_GUIDE.md (NEW)
└── BMS_IMPLEMENTATION_SUMMARY.md (NEW)
```

---

## 🔗 API Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/api/bills` | Create bill |
| GET | `/api/bills` | List bills (paginated) |
| GET | `/api/bills/:id` | Get bill details |
| PUT | `/api/bills/:id` | Update bill |
| POST | `/api/bills/:id/send` | Send to BMS |
| DELETE | `/api/bills/:id` | Cancel bill |
| POST | `/api/bills/sync/masters` | Sync inventory |

---

## 💻 Quick API Examples

### Create Bill
```bash
curl -X POST http://localhost:8000/api/bills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "abc-123",
    "items": [{
      "particular_id": "xyz-456",
      "quantity": 10,
      "rate": 500,
      "amount": 5000
    }],
    "total_amount": 5000
  }'
```

### Get Bills
```bash
curl -X GET "http://localhost:8000/api/bills?limit=20" \
  -H "Authorization: Bearer <token>"
```

### Send to BMS
```bash
curl -X POST http://localhost:8000/api/bills/bill-id/send \
  -H "Authorization: Bearer <token>"
```

---

## 🗄️ Database Tables

**bills** - Stores bill records
**bill_items** - Line items in bills
**bill_sync_log** - Sync audit trail
**customers** - Customer master
**particulars** - Items/products

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Axios not found | `npm install axios` |
| BMS connection fails | Check BMS_API_URL in .env |
| Bills not syncing | Check BMS health: `curl http://localhost:3001/api/health` |
| Database error | Run migration: `psql -U postgres -d mdengineers -f sql/bills_migration.sql` |
| Auth error | Verify JWT token is valid |

---

## 📊 Bill Status Flow

```
draft → synced → sent → paid
  ↓
  cancelled
```

- **draft**: Created but not synced to BMS
- **synced**: Successfully created in BMS
- **sent**: Sent to customer
- **paid**: Payment received
- **cancelled**: Bill cancelled

---

## 📖 Documentation Files

1. **BMS_IMPLEMENTATION_SUMMARY.md** - What was built
2. **docs/BMS_INTEGRATION.md** - Complete API documentation
3. **BMS_BACKEND_SETUP.md** - Installation & setup
4. **BMS_TESTING_GUIDE.md** - Testing procedures

---

## 🔑 Key Features

✅ Automatic BMS sync on bill creation  
✅ Graceful handling of BMS failures  
✅ Bill editing & cancellation  
✅ Master data synchronization  
✅ Comprehensive error handling  
✅ Complete audit logging  
✅ Input validation  
✅ Authentication required  

---

## 🎯 Next: Frontend Integration

Ready to build the React UI components for:
- Bill creation form
- Bill listing with pagination
- Bill editing interface
- Sync status indicators
- Customer & item selectors

See **BMS Frontend Integration Guide** (coming next)

---

## ✅ Verification Checklist

- [ ] npm install complete
- [ ] .env configured with BMS_API_URL
- [ ] Database migration applied
- [ ] Backend starts without errors
- [ ] Can get auth token
- [ ] Can create a bill
- [ ] Bill appears in BMS
- [ ] Can view bill details
- [ ] Can edit draft bills
- [ ] Can send bill to BMS

---

**Version:** 1.0.0  
**Status:** ✅ Backend Complete, Ready for Frontend  
**Last Updated:** May 19, 2026
