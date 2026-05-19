const { Pool } = require("pg");

const pool = new Pool({
<<<<<<< HEAD
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
=======
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
>>>>>>> parent of 4143eaf (feat: Implement Railway PostgreSQL connection and migration scripts)
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => console.error("❌ PostgreSQL connection failed:", err));

module.exports = pool;