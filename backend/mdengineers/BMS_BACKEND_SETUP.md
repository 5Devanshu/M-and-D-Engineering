# BMS Backend Integration Setup Guide

## Quick Start

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- M and D Engineering backend running
- BMS backend running on accessible URL

### Step 1: Install Dependencies

```bash
cd /Users/devanshu/Desktop/M\ and\ D\ Engineering/backend/mdengineers
npm install
```

This will install `axios` and other required dependencies.

### Step 2: Update Environment Variables

Create or update `.env` file:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=mdengineers

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# BMS Integration Configuration
BMS_API_URL=http://localhost:3001
BMS_API_KEY=your_bms_api_key
BMS_MAX_RETRIES=3
BMS_RETRY_DELAY=1000
```

### Step 3: Create Database Tables

Run the migration to create bills-related tables:

```bash
psql -U postgres -d mdengineers -f sql/bills_migration.sql
```

Or if using pgAdmin, execute the SQL commands from `sql/bills_migration.sql`.

### Step 4: Seed Sample Data (Optional)

Create sample customers and particulars:

```bash
# Create a seed script if not exists
# Or manually insert sample data:

psql -U postgres -d mdengineers

-- Insert sample customer
INSERT INTO customers (id, name, email, phone, gst_number)
VALUES (gen_random_uuid(), 'ABC Manufacturing', 'abc@example.com', '9876543210', '18AABCU1234N1Z0');

-- Insert sample particular
INSERT INTO particulars (id, name, hsn_code, unit, tax_applicable, tax_rate)
VALUES (gen_random_uuid(), 'Chemical A', '2811.19.90', 'kg', true, 18);
```

### Step 5: Start the Backend

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

You should see:
```
✅ Server running on port 8000
🚀 M&D Engineers ERP API running
```

### Step 6: Verify BMS Connection

Test the BMS health check:

```bash
curl -X GET http://localhost:8000/api/health \
  -H "Authorization: Bearer <your_token>"
```

## Testing the Integration

### 1. Authenticate to Get Token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

Save the token from response.

### 2. Create a Customer (If Not Exists)

```bash
# Use existing customer ID from your database
# Or create via the users/masters endpoint
```

### 3. Create a Bill

```bash
curl -X POST http://localhost:8000/api/bills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "your-customer-uuid",
    "items": [
      {
        "particular_id": "your-particular-uuid",
        "quantity": 10,
        "rate": 500,
        "amount": 5000
      }
    ],
    "total_amount": 5000,
    "description": "Test Bill",
    "due_date": "2026-06-19"
  }'
```

### 4. Get the Bill

```bash
curl -X GET http://localhost:8000/api/bills/<bill-id> \
  -H "Authorization: Bearer <token>"
```

### 5. Send Bill to BMS

```bash
curl -X POST http://localhost:8000/api/bills/<bill-id>/send \
  -H "Authorization: Bearer <token>"
```

### 6. Sync Masters to BMS

```bash
curl -X POST http://localhost:8000/api/bills/sync/masters \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "particulars": [
      {
        "id": "particular-uuid",
        "name": "Chemical X",
        "hsn_code": "2811.19.90",
        "unit": "kg",
        "tax_applicable": true
      }
    ]
  }'
```

## Project Structure

```
mdengineers/
├── src/
│   ├── app.js                          # Express app
│   ├── server.js                       # Server entry point
│   ├── routes.js                       # Main routes file (updated)
│   ├── config/
│   │   ├── db.js                       # Database config
│   │   ├── env.js                      # Environment variables
│   │   ├── jwt.js                      # JWT config
│   │   └── logger.js                   # Winston logger
│   ├── middlewares/
│   │   ├── auth.middleware.js          # Authentication
│   │   ├── error.middleware.js         # Error handling
│   │   └── role.middleware.js          # Role-based access
│   ├── modules/
│   │   └── bills/                      # NEW: Bills Module
│   │       ├── bills.controller.js     # Controllers
│   │       ├── bills.service.js        # Business logic
│   │       ├── bills.routes.js         # Routes
│   │       └── bills.validation.js     # Input validation
│   ├── services/
│   │   └── bms.integration.service.js  # NEW: BMS Integration
│   └── utils/
│       ├── asyncHandler.js             # Async middleware
│       └── apiResponse.js              # Response formatting
├── sql/
│   └── bills_migration.sql             # NEW: Database schema
├── docs/
│   └── BMS_INTEGRATION.md              # NEW: Documentation
├── .env                                # Environment variables
├── .env.example.bms                    # NEW: Example env
├── package.json                        # Updated with axios
└── README.md
```

## Troubleshooting

### Issue: "Cannot find module 'axios'"

**Solution:**
```bash
npm install axios
```

### Issue: "Connection refused" error for BMS

**Check:**
1. BMS backend is running on the correct URL
2. BMS_API_URL is correct in `.env`
3. Firewall is not blocking the connection
4. Network connectivity between services

```bash
# Test connectivity
curl -I http://localhost:3001/api/health
```

### Issue: "Database connection failed"

**Check:**
```bash
# Test database connection
psql -U postgres -d mdengineers -c "SELECT 1;"

# Check migration was applied
psql -U postgres -d mdengineers -c "SELECT * FROM information_schema.tables WHERE table_name='bills';"
```

### Issue: "Unauthorized" error

**Check:**
1. JWT token is valid and not expired
2. Token includes user ID
3. User exists in database

```bash
# Verify token
curl -X POST http://localhost:8000/api/auth/verify-token \
  -H "Authorization: Bearer <token>"
```

### Issue: "Bill created but not synced to BMS"

**Check logs:**
```bash
tail -f logs/error.log | grep BMS
```

**Possible causes:**
- BMS API is unreachable
- API key is invalid
- Network timeout

**Solution:**
- Retry sending the bill via `/api/bills/:billId/send`
- Check BMS health: `curl http://localhost:3001/api/health`
- Verify BMS_API_URL and BMS_API_KEY in .env

## File Locations

| File | Location |
|------|----------|
| BMS Integration Service | `src/services/bms.integration.service.js` |
| Bills Module | `src/modules/bills/` |
| Database Migration | `sql/bills_migration.sql` |
| Documentation | `docs/BMS_INTEGRATION.md` |
| Environment Example | `.env.example.bms` |

## Next Steps

### 1. Frontend Integration
After backend is running, proceed to:
- `/Users/devanshu/Desktop/M and D Engineering Frontend/md-engineers-frontend/`
- Create bill creation UI
- Implement bill viewing and editing
- Add sync status indicators

### 2. Advanced Features
- Implement webhook integration with BMS
- Add bulk bill creation
- Set up payment tracking
- Create email notifications

### 3. Testing
- Write unit tests for services
- Write integration tests for API endpoints
- Test error scenarios
- Performance testing

## Deployment Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Set up `.env` file with correct credentials
- [ ] Create database tables (migration)
- [ ] Test BMS API connectivity
- [ ] Verify database connection
- [ ] Test authentication
- [ ] Create sample bills and verify sync
- [ ] Check error logs
- [ ] Set up monitoring
- [ ] Configure logging levels for production

## Support & Contact

For issues during setup:
1. Check logs: `tail -f logs/error.log`
2. Review documentation: `docs/BMS_INTEGRATION.md`
3. Verify environment configuration
4. Test API endpoints manually with Postman

---

**Version:** 1.0.0  
**Last Updated:** May 19, 2026
