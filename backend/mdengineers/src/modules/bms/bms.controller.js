const { proxyToBMS } = require('./bms.service');
const asyncHandler   = require('../../utils/asyncHandler');

exports.proxy = asyncHandler(async (req, res) => {
  const hasBody = req.body && Object.keys(req.body).length > 0;
  const result  = await proxyToBMS({
    method: req.method,
    path:   req.path,          // already stripped of /bms prefix
    params: req.query,
    data:   hasBody ? req.body : undefined,
  });
  res.status(200).json(result);
});