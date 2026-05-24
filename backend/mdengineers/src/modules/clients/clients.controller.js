const db           = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');

/* GET /api/clients */
exports.getAll = asyncHandler(async (req, res) => {
  const { search = '', is_active, limit = 100, offset = 0 } = req.query;
  const vals = [];
  let where  = 'WHERE 1=1';

  if (search) {
    vals.push(`%${search}%`);
    where += ` AND (client_name ILIKE $${vals.length}
                OR client_code  ILIKE $${vals.length}
                OR email        ILIKE $${vals.length})`;
  }
  if (is_active !== undefined) {
    vals.push(is_active === 'true');
    where += ` AND is_active = $${vals.length}`;
  }

  vals.push(Number(limit), Number(offset));
  const { rows } = await db.query(
    `SELECT * FROM clients ${where}
     ORDER BY client_name ASC
     LIMIT $${vals.length - 1} OFFSET $${vals.length}`,
    vals
  );
  res.json({ success: true, data: rows, total: rows.length });
});

/* GET /api/clients/:id */
exports.getById = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM clients WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Client not found' });
  res.json({ success: true, data: rows[0] });
});

/* POST /api/clients */
exports.create = asyncHandler(async (req, res) => {
  const {
    client_code, client_name, contact_person, email, phone,
    billing_address, shipping_address, gstin, pan,
    state, state_code, payment_terms_days = 30, credit_limit,
  } = req.body;

  if (!client_code || !client_name || !email)
    return res.status(400).json({ success: false, message: 'client_code, client_name and email are required' });

  const { rows } = await db.query(
    `INSERT INTO clients
       (client_code,client_name,contact_person,email,phone,
        billing_address,shipping_address,gstin,pan,
        state,state_code,payment_terms_days,credit_limit,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      client_code.toUpperCase().trim(), client_name.trim(),
      contact_person || null, email.trim(), phone || null,
      billing_address || null, shipping_address || null,
      gstin?.toUpperCase() || null, pan?.toUpperCase() || null,
      state || null, state_code || null,
      payment_terms_days, credit_limit || null,
      req.user?.id || null,
    ]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Client created' });
});

/* PUT /api/clients/:id */
exports.update = asyncHandler(async (req, res) => {
  const fields = [
    'client_name','contact_person','email','phone',
    'billing_address','shipping_address','gstin','pan',
    'state','state_code','payment_terms_days','credit_limit','is_active',
  ];
  const vals = [];
  const sets = [];

  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      vals.push(req.body[f]);
      sets.push(`${f} = $${vals.length}`);
    }
  });

  if (!sets.length)
    return res.status(400).json({ success: false, message: 'Nothing to update' });

  vals.push(req.params.id);
  const { rows } = await db.query(
    `UPDATE clients SET ${sets.join(', ')}, updated_at=NOW()
     WHERE id=$${vals.length} RETURNING *`,
    vals
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Client not found' });
  res.json({ success: true, data: rows[0], message: 'Client updated' });
});

/* DELETE /api/clients/:id — soft delete */
exports.deactivate = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE clients SET is_active=false, updated_at=NOW() WHERE id=$1 RETURNING id`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Client not found' });
  res.json({ success: true, message: 'Client deactivated' });
});