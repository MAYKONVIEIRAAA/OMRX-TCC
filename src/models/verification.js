const pool = require("../config/db");

async function create({ url, statusId, threatTypeId, userId }) {
  const [result] = await pool.execute(
    "INSERT INTO verifications (url, status_id, threat_type_id, user_id) VALUES (?, ?, ?, ?)",
    [url, statusId, threatTypeId, userId]
  );

  return result.insertId;
}

module.exports = { create };