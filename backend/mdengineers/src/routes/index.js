/**
 * Main Routes Configuration
 */

const express = require('express');
const router = express.Router();

// Import route modules
const bmsIntegrationRoutes = require('./bmsIntegration.routes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'M&D Engineers ERP API running',
    timestamp: new Date(),
  });
});

// BMS Integration Routes
router.use('/bms', bmsIntegrationRoutes);

// Additional module routes can be added here
// Example:
// router.use('/employees', employeesRoutes);
// router.use('/attendance', attendanceRoutes);
// etc.

module.exports = router;
