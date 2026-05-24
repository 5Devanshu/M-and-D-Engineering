const axios = require('axios');

const bmsClient = axios.create({
  baseURL: process.env.BMS_API_URL,
  headers: {
    'Content-Type':  'application/json',
    'X-API-Key':     process.env.BMS_API_KEY,
    'X-API-Secret':  process.env.BMS_API_SECRET,
  },
  timeout: 15000,
});

// Log every BMS call for debugging
bmsClient.interceptors.request.use((config) => {
  console.log(`📡 BMS → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

bmsClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('❌ BMS Error:', err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

const proxyToBMS = async ({ method, path, params, data }) => {
  const res = await bmsClient.request({
    method,
    url:    `/v1${path}`,
    params,
    data,
  });
  return res.data;
};

module.exports = { proxyToBMS };