const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const h = require("../helpers/harness");
const { request, db, loginToken, bearer, defaultUser, expectResponse } = h;

h.useServer();

const del = (body, headers) => request("DELETE", "/delete", { body, headers });

describe("DELETE /delete — exclusao de conta do usuario", () => {
  it("Deve responder 401 sem token de autenticacao", async () => {
    expectResponse(
      await del({ currentPassword: defaultUser.password, confirmDeletion: true }),
      { status: 401, body: { error: "Token não fornecido" } }
    );
  });

  it("Deve responder 400 quando a senha atual nao e enviada", async () => {
    const token = await loginToken();
    expectResponse(await del({ confirmDeletion: true }, bearer(token)), {
      status: 400,
      body: { error: "Confirme a exclusão informando sua senha atual e marcando a caixa de confirmação." },
    });
  });

  it("Deve responder 400 quando confirmDeletion nao e enviado", async () => {
    const token = await loginToken();
    expectResponse(await del({ currentPassword: defaultUser.password }, bearer(token)), {
      status: 400,
      body: { error: "Confirme a exclusão informando sua senha atual e marcando a caixa de confirmação." },
    });
  });

  it("Deve responder 400 quando confirmDeletion e false", async () => {
    const token = await loginToken();
    expectResponse(
      await del({ currentPassword: defaultUser.password, confirmDeletion: false }, bearer(token)),
      {
        status: 400,
        body: { error: "Confirme a exclusão informando sua senha atual e marcando a caixa de confirmação." },
      }
    );
  });

  it("Deve responder 401 quando a senha atual esta incorreta", async () => {
    const token = await loginToken();
    expectResponse(
      await del({ currentPassword: "senhaErrada123", confirmDeletion: true }, bearer(token)),
      { status: 401, body: { error: "Senha atual incorreta." } }
    );
  });

  it("Deve responder 204 e remover o usuario do banco", async () => {
    const token = await loginToken();
    const res = await del({ currentPassword: defaultUser.password, confirmDeletion: true }, bearer(token));
    assert.equal(res.status, 204);
    assert.equal(db.users().length, 0);
  });

  it("Nao deve remover o usuario quando a validacao falha", async () => {
    const token = await loginToken();
    await del({ currentPassword: "senhaErrada123", confirmDeletion: true }, bearer(token));
    assert.equal(db.users().length, 1);
  });

  it("Deve responder 500 quando ocorre um erro ao excluir no banco", async (t) => {
    t.mock.method(console, "error", () => {});
    const token = await loginToken();
    const originalExecute = db.pool.execute;
    const realExecute = originalExecute;

    db.pool.execute = async (sql, params) => {
      if (sql.replace(/\s+/g, " ").trim().startsWith("DELETE FROM users")) {
        throw new Error("falha de conexao com o banco");
      }
      return realExecute(sql, params);
    };

    try {
      const res = await del({ currentPassword: defaultUser.password, confirmDeletion: true }, bearer(token));
      expectResponse(res, {
        status: 500,
        body: { error: "Nao foi possivel excluir sua conta. Tente novamente mais tarde." },
      });
    } finally {
      db.pool.execute = originalExecute;
    }
  });
});