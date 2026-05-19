const { Pool } = require("pg");

// For Railway production: Use DATABASE_URL
// For Local development: Use individual env vars
const pool = new Pool({
<<<<<<< HEAD
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'mdengineers'}`,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,
=======
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
>>>>>>> parent of 6f259f9 (feat: Implement billing system with BMS integration)
});

pool.connect()
  .then(() => {
    console.log("✅ PostgreSQL connected");
    console.log("📍 Using:", process.env.DATABASE_URL ? "Railway DATABASE_URL" : "Local DB Config");
  })
  .catch(err => console.error("❌ PostgreSQL connection failed:", err));

module.exports = pool;