const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const h = require("../helpers/harness");
const f = require("../helpers/fixtures");
const { db, mail, post, defaultUser, config, expectResponse, runCases } = h;
const { credentials, verifiedAccount, pendingUser, expiredPendingUser, lastToken, silenceErrors } = f;

const MSG = config.EMAIL_VERIFICATION_MESSAGES;
const INVALID = { error: "Email ou senha inválidos" };
const MISSING = { error: "Os campos email e senha são obrigatórios." };
const NOT_VERIFIED = { error: MSG.NOT_VERIFIED, code: "EMAIL_NOT_VERIFIED" };
const RESENT = { error: MSG.EXPIRED_RESENT, code: "EMAIL_VERIFICATION_RESENT" };

h.useServer();

describe("POST /users/login — autenticação", () => {
  describe("Quando as credenciais são válidas e o email está verificado", () => {
    beforeEach(verifiedAccount);

    it("Deve responder 200 com um JWT assinado contendo o id e o email do usuário", async () => {
      const res = await post("/users/login", credentials);
      const { id, email, exp, iat } = h.jwt.verify(res.body.token, process.env.jwt_secret);

      expectResponse(res, { status: 200, body: { token: res.body.token } });
      assert.deepEqual(
        { id, email, expiresInFuture: exp > iat },
        { id: 1, email: "teste@exemplo.com", expiresInFuture: true }
      );
    });

    it("Deve aceitar o email com maiúsculas/minúsculas diferentes do cadastro", async () => {
      const res = await post("/users/login", { ...credentials, email: "TESTE@EXEMPLO.COM" });

      expectResponse(res, { status: 200, body: { token: res.body.token } });
    });
  });

  describe("Quando as credenciais são inválidas ou incompletas", () => {
    beforeEach(verifiedAccount);

    runCases("/users/login", [
      { name: "Deve responder 401 quando a senha está incorreta",    send: { ...credentials, password: "senha-errada-1" }, expect: { status: 401, body: INVALID } },
      { name: "Deve responder 401 quando o email não está cadastrado",  send: { ...credentials, email: "x@exemplo.com" },     expect: { status: 401, body: INVALID } },
      { name: "Deve responder 401 quando o email não é enviado",          send: { password: "senha12345" },                     expect: { status: 401, body: MISSING } },
      { name: "Deve responder 401 quando a senha não é enviada",          send: { email: "teste@exemplo.com" },                 expect: { status: 401, body: MISSING } },
      { name: "Deve responder 401 quando o corpo da requisição está vazio",        send: {},                                             expect: { status: 401, body: MISSING } },
      { name: "Deve responder 401 quando o email está vazio",        send: { email: "", password: "senha12345" },          expect: { status: 401, body: MISSING } },
      { name: "Deve responder 401 quando a senha está vazia",        send: { email: "teste@exemplo.com", password: "" },   expect: { status: 401, body: MISSING } },
    ]);
  });

  describe("Quando o email ainda não foi verificado", () => {
    beforeEach(() => h.register());

    it("Deve responder 403 EMAIL_NOT_VERIFIED, sem token, quando a senha está correta", async () => {
      expectResponse(await post("/users/login", credentials), { status: 403, body: NOT_VERIFIED });
    });

    it("Deve responder 401 genérico, sem revelar que a conta está pendente, quando a senha está errada", async () => {
      expectResponse(await post("/users/login", { ...credentials, password: "senha-errada-1" }), {
        status: 401,
        body: INVALID,
      });
    });

    it("Não deve reenviar o email enquanto o link ainda é válido", async () => {
      mail.sent = [];

      await post("/users/login", credentials);

      assert.equal(mail.sent.length, 0);
    });
  });

  describe("Quando o email não foi verificado e o link de confirmação expirou", () => {
    it("Deve responder 403 EMAIL_VERIFICATION_RESENT, sem token, e enviar um novo link ao email da conta", async () => {
      await expiredPendingUser();

      const res = await post("/users/login", credentials);

      expectResponse(res, { status: 403, body: RESENT });
      assert.deepEqual(mail.sent.map((m) => m.to), ["teste@exemplo.com"]);
    });

    it("Deve trocar o token expirado por um novo que confirma o email e libera o login", async () => {
      const { token: oldToken, row } = await expiredPendingUser();

      await post("/users/login", credentials);
      const newToken = lastToken();

      assert.notEqual(newToken, oldToken);
      assert.equal(db.tokensOf(row.user_id).length, 1);
      expectResponse(await post("/users/verify-email", { token: newToken }), {
        status: 200,
        body: { message: MSG.VERIFIED },
      });
      expectResponse(await post("/users/login", credentials), { status: 200 });
    });

    it("Deve reenviar só uma vez: o login seguinte volta a responder EMAIL_NOT_VERIFIED", async () => {
      await expiredPendingUser();

      await post("/users/login", credentials);
      const second = await post("/users/login", credentials);

      expectResponse(second, { status: 403, body: NOT_VERIFIED });
      assert.equal(mail.sent.length, 1);
    });

    it("Deve reenviar quando a conta não tem nenhum token (ex.: o envio do cadastro falhou)", async () => {
      const { row } = await pendingUser();
      db.tokens().length = 0;
      mail.sent = [];

      expectResponse(await post("/users/login", credentials), { status: 403, body: RESENT });
      assert.equal(db.tokensOf(row.user_id).length, 1);
      assert.equal(mail.sent.length, 1);
    });

    it("Deve responder 401 genérico e não reenviar quando a senha está errada", async () => {
      await expiredPendingUser();

      const res = await post("/users/login", { ...credentials, password: "senha-errada-1" });

      expectResponse(res, { status: 401, body: INVALID });
      assert.equal(mail.sent.length, 0);
    });

    it("Deve responder 502 quando o envio falha e tentar de novo no próximo login", async (t) => {
      silenceErrors(t);
      const { row } = await expiredPendingUser();
      mail.failWith = new Error("SMTP fora do ar");

      expectResponse(await post("/users/login", credentials), {
        status: 502,
        body: { error: MSG.EXPIRED_RESEND_FAILED },
      });
      assert.equal(db.tokensOf(row.user_id).length, 0);

      mail.failWith = null;

      expectResponse(await post("/users/login", credentials), { status: 403, body: RESENT });
      assert.equal(mail.sent.length, 1);
    });
  });

  describe("Quando o corpo ou os tipos dos campos são inválidos", () => {
    it("Deve responder 401 quando password não é texto", async (t) => {
      silenceErrors(t);
      await verifiedAccount();

      const res = await post("/users/login", { email: defaultUser.email, password: 12345678 });

      expectResponse(res, { status: 401 });
    });
  });
});
