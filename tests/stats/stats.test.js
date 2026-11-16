const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const h = require("../helpers/harness");
const { request, db } = h;

h.useServer();

describe("GET /stats — estatísticas de verificações", () => {
  it("Deve responder 200 com total zero quando não há verificações", async () => {
    const res = await request("GET", "/stats");

    assert.equal(res.status, 200);
    assert.equal(res.body.totalVerifications, 0);
    assert.equal(res.body.lastUpdatedAt, null);
  });

  it("Deve responder 200 com o total correto após verificações salvas", async () => {
    await db.pool.execute(
      "INSERT INTO verifications (url, status_id, threat_type_id, user_id) VALUES (?, ?, ?, ?)",
      ["https://exemplo.com", 2, null, null]
    );
    await db.pool.execute(
      "INSERT INTO verifications (url, status_id, threat_type_id, user_id) VALUES (?, ?, ?, ?)",
      ["https://outro.com", 4, 2, null]
    );

    const res = await request("GET", "/stats");

    assert.equal(res.status, 200);
    assert.equal(res.body.totalVerifications, 2);
    assert.ok(res.body.lastUpdatedAt);
  });
});