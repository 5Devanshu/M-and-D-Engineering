require('dotenv').config();

const env = {
  port:    process.env.PORT        || 8000,
  nodeEnv: process.env.NODE_ENV    || 'development',
  db: {
    host:     process.env.DB_HOST     || undefined,
    port:     parseInt(process.env.DB_PORT) || undefined,
    user:     process.env.DB_USER     || undefined,
    password: process.env.DB_PASSWORD || undefined,
    name:     process.env.DB_NAME     || undefined,
  },
  jwt: {
    secret:         process.env.JWT_SECRET            || 'fallback_secret',
    expiresIn:      process.env.JWT_EXPIRES_IN         || '24h',
    refreshSecret:  process.env.JWT_REFRESH_SECRET     || 'fallback_refresh',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // BMS Integration
  bms: {
    apiUrl:    process.env.BMS_API_URL       || 'http://localhost:5000/api',
    apiKey:    process.env.BMS_API_KEY       || '2ddfda4cc80bcd0835a102192d72deda5b5e3a52ba6cd17e850d618a95a3d097',
    apiSecret: process.env.BMS_API_SECRET    || '02d1f36d16806e5638d16b068ffec439efc1895b9c9595902cfec7debd4541168c16f3676a05474771c3937171b58f4cafaa112abb31bbe398e4bd5c53005776',
  },
};

module.exports = env;