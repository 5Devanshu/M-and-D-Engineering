const db = require('../../config/db');

const getById = async (id) => {
  const { rows } = await db.query(
    'SELECT * FROM materials_master WHERE id = $1', [id]
  );
  if (!rows.length) {
    const err = new Error('Material not found');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

const getAll = async ({ include_inactive = false } = {}) => {
  const { rows } = await db.query(
    `SELECT id, name, unit, default_rate, hsn_code, gst_rate, is_active, created_at
     FROM materials_master
     ${include_inactive ? '' : 'WHERE is_active = true'}
     ORDER BY name ASC`
  );
  return rows;
};

const create = async ({ name, unit, default_rate, hsn_code = '9988', gst_rate = 18 }) => {
  const { rows } = await db.query(
    `INSERT INTO materials_master (name, unit, default_rate, hsn_code, gst_rate)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [name, unit, default_rate, hsn_code, gst_rate]
  );
  return getById(rows[0].id);
};

const update = async (id, fields) => {
  await getById(id);
  const allowed = ['name', 'unit', 'hsn_code', 'gst_rate', 'is_active'];
  const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));

  if (!updates.length) {
    const err = new Error('No valid fields to update');
    err.statusCode = 400;
    throw err;
  }

  const setClause = updates.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const values    = [...updates.map(([, v]) => v), id];
  await db.query(
    `UPDATE materials_master SET ${setClause} WHERE id = $${updates.length + 1}`,
    values
  );
  return getById(id);
};

const delete_delete = async (id) => {
  await getById(id);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // Delete related rate history first
    await client.query('DELETE FROM material_rate_history WHERE material_id = $1', [id]);
    // Delete material
    await client.query('DELETE FROM materials_master WHERE id = $1', [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateRate = async (id, { new_rate, effective_from, reason }, changedBy) => {
  const material = await getById(id);
  const old_rate = material.default_rate;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Update default rate
    await client.query(
      'UPDATE materials_master SET default_rate = $1 WHERE id = $2',
      [new_rate, id]
    );

    // Log rate change
    await client.query(
      `INSERT INTO material_rate_history (material_id, old_rate, new_rate, effective_from, reason, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, old_rate, new_rate, effective_from || new Date(), reason || null, changedBy]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getById(id);
};

const getRateHistory = async (id) => {
  await getById(id);
  const { rows } = await db.query(
    `SELECT id, material_id, old_rate, new_rate, effective_from, reason, changed_by, created_at
     FROM material_rate_history
     WHERE material_id = $1
     ORDER BY created_at DESC`,
    [id]
  );
  return rows;
};

const getRateOnDate = async (id, date) => {
  await getById(id);
  const { rows } = await db.query(
    `SELECT new_rate as rate, effective_from
     FROM material_rate_history
     WHERE material_id = $1 AND effective_from::date <= $2
     ORDER BY effective_from DESC
     LIMIT 1`,
    [id, date || new Date()]
  );
  return rows.length ? rows[0] : { rate: null, message: 'No rate history found for this date' };
};

module.exports = { getAll, getById, create, update, delete: delete_delete, updateRate, getRateHistory, getRateOnDate };
