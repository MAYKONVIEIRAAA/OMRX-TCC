const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const h = require("../helpers/harness");
const { request, db, loginToken, bearer, defaultUser, expectResponse } = h;

h.useServer();

const del = (body, headers) => request("DELETE", "/delete", { body, headers });

describe("DELETE /delete — exclusao de conta do usuario", () => {
  it("Deve responder 401 sem token de autenticacao", async () => {
    expectResponse(
      await del({ email: defaultUser.email, confirmDeletion: true }),
      { status: 401, body: { error: "Token não fornecido" } }
    );
  });

  it("Deve responder 400 quando o email nao e enviado", async () => {
    const token = await loginToken();
    expectResponse(await del({ confirmDeletion: true }, bearer(token)), {
      status: 400,
      body: { error: "Confirme a exclusão informando seu email e marcando a caixa de confirmação." },
    });
  });

  it("Deve responder 400 quando confirmDeletion nao e enviado", async () => {
    const token = await loginToken();
    expectResponse(await del({ email: defaultUser.email }, bearer(token)), {
      status: 400,
      body: { error: "Confirme a exclusão informando seu email e marcando a caixa de confirmação." },
    });
  });

  it("Deve responder 400 quando confirmDeletion e false", async () => {
    const token = await loginToken();
    expectResponse(await del({ email: defaultUser.email, confirmDeletion: false }, bearer(token)), {
      status: 400,
      body: { error: "Confirme a exclusão informando seu email e marcando a caixa de confirmação." },
    });
  });

  it("Deve responder 403 quando o email informado nao confere com a conta autenticada", async () => {
    const token = await loginToken();
    expectResponse(
      await del({ email: "outro@exemplo.com", confirmDeletion: true }, bearer(token)),
      { status: 403, body: { error: "O email informado não confere com a conta autenticada." } }
    );
  });

  it("Deve aceitar o email em maiusculas/minusculas diferentes do cadastro", async () => {
    const token = await loginToken();
    const res = await del({ email: defaultUser.email.toUpperCase(), confirmDeletion: true }, bearer(token));

    assert.equal(res.status, 204);
  });

  it("Deve responder 204 e remover o usuario do banco", async () => {
    const token = await loginToken();

    const res = await del({ email: defaultUser.email, confirmDeletion: true }, bearer(token));

    assert.equal(res.status, 204);
    assert.equal(db.users().length, 0);
  });

  it("Nao deve remover o usuario quando a validacao falha", async () => {
    const token = await loginToken();
    await del({ email: "outro@exemplo.com", confirmDeletion: true }, bearer(token));

    assert.equal(db.users().length, 1);
  });

  it("Deve responder 500 quando ocorre um erro ao excluir no banco", async (t) => {
    t.mock.method(console, "error", () => {});
    const token = await loginToken();

    const originalExecute = db.pool.execute;
    db.pool.execute = async () => {
      throw new Error("falha de conexao com o banco");
    };

    try {
      const res = await del({ email: defaultUser.email, confirmDeletion: true }, bearer(token));

      expectResponse(res, {
        status: 500,
        body: { error: "Nao foi possivel excluir sua conta. Tente novamente mais tarde." },
      });
    } finally {
      db.pool.execute = originalExecute;
    }
  });
});