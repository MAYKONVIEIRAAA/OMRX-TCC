const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const h = require("../helpers/harness");
const { request, db, loginToken, bearer, defaultUser, expectResponse } = h;

h.useServer();

const getAccount = (headers) => request("GET", "/account", { headers });

describe("GET /account — dados gerais da conta", () => {
  it("Deve responder 401 sem token de autenticacao", async () => {
    expectResponse(await getAccount(), { status: 401, body: { error: "Token não fornecido" } });
  });

  it("Deve responder 200 com nome, email e data de criacao da conta", async () => {
    const token = await loginToken();

    const res = await getAccount(bearer(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.name, defaultUser.name);
    assert.equal(res.body.email, defaultUser.email);
    assert.ok(res.body.createdAt);
  });

  it("Nao deve retornar a senha (hash) em nenhum campo da resposta", async () => {
    const token = await loginToken();

    const res = await getAccount(bearer(token));

    const values = Object.values(res.body);
    assert.ok(!values.some((v) => typeof v === "string" && v.startsWith("$2")));
    assert.equal(res.body.senha_hash, undefined);
    assert.equal(res.body.password, undefined);
  });

  it("Deve responder 404 quando a conta nao existe mais", async () => {
    const token = await loginToken();
    const user = db.findUser(defaultUser.email);
    db.users().splice(db.users().indexOf(user), 1);

    expectResponse(await getAccount(bearer(token)), {
      status: 404,
      body: { error: "Conta não encontrada." },
    });
  });
});