const { proxyToBMS, streamFromBMS } = require('./bms.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.proxy = asyncHandler(async (req, res) => {

  // ── PDF endpoints: stream binary directly, never JSON-serialize ──────────
  if (req.path.endsWith('/pdf')) {
    try {
      const { stream, contentType, disposition } = await streamFromBMS(
        req.path,
        req.query
      );
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', disposition);
      res.setHeader('Cache-Control', 'no-cache');
      stream.pipe(res);   // pipe raw bytes straight to browser
    } catch (err) {
      const status  = err.response?.status  || 500;
      const message = err.response?.data?.message || err.message || 'PDF generation failed';
      console.error(`❌ BMS PDF error [${status}] ${req.path}:`, message);
      res.status(status).json({ success: false, message });
    }
    return;
  }

  // ── Everything else: normal JSON proxy ───────────────────────────────────
  const hasBody = req.body && Object.keys(req.body).length > 0;
  try {
    const result = await proxyToBMS({
      method: req.method,
      path:   req.path,
      params: req.query,
      data:   hasBody ? req.body : undefined,
    });
    res.status(200).json(result);
  } catch (err) {
    const status  = err.response?.status  || 500;
    const message = err.response?.data?.message || err.message || 'BMS API error';
    const data    = err.response?.data    || {};
    console.error(`❌ BMS proxy error [${status}] ${req.method} ${req.path}:`, data);
    res.status(status).json({ success: false, message, ...data });
  }
});