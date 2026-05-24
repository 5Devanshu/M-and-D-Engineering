const router = require('express').Router();

router.use('/auth',              require('./modules/auth/auth.routes'));
router.use('/users',             require('./modules/users/users.routes'));
router.use('/masters/chemicals', require('./modules/masters/masters.routes'));
router.use('/masters/materials', require('./modules/materials/materials.routes'));
router.use('/stock',             require('./modules/stock/stock.routes'));
router.use('/employees',         require('./modules/employees/employees.routes'));
router.use('/attendance',        require('./modules/attendance/attendance.routes'));
router.use('/loans',             require('./modules/loans/loans.routes'));
router.use('/salary',            require('./modules/salary/salary.routes'));
router.use('/expenses',          require('./modules/expenses/expenses.routes'));

// ✅ M&D own clients
router.use('/clients',           require('./modules/clients/clients.routes'));

// ✅ BMS proxy — fixes the 500 on POST /api/bms/clients
router.use('/bms',               require('./modules/bms/bms.routes'));

module.exports = router;