const { describe, it } = require("node:test");

const h = require("../helpers/harness");
const { post, provider, reply, hangUntilAborted, loginToken, bearer, expectResponse, db } = h;

h.useServer();

function scanResult({ malicious = false, categories = [] } = {}) {
  return {
    verdicts: { overall: { malicious, categories, tags: [] } },
    page: { domain: "exemplo.com", url: "https://exemplo.com" },
    stats: { malicious: malicious ? 1 : 0, ipStats: [{ requests: 5 }], securePercentage: 100 },
    task: { time: "2026-01-01T00:00:00Z", success: true },
    meta: { processors: {} },
  };
}

describe("POST /verify — verificação completa (polling)", () => {
  it("Deve responder 401 sem token de autenticação", async () => {
    expectResponse(await post("/verify", { url: "https://exemplo.com" }), {
      status: 401,
      body: { error: "Token não fornecido" },
    });
  });

  it("Deve responder 400 quando o link é inválido", async () => {
    const token = await loginToken();
    expectResponse(await post("/verify", { url: "nao-e-url" }, bearer(token)), {
      status: 400,
      body: { error: "Esse link não é válido" },
    });
  });

  it("Deve responder 200 e salvar a verificação quando o link é seguro", async () => {
    const token = await loginToken();
    provider.handler = (url) => {
      if (url.includes("/result/")) return reply(200, scanResult({ malicious: false }));
      return reply(200, { uuid: "scan-1" });
    };

    const res = await post("/verify", { url: "https://exemplo.com" }, bearer(token));

    expectResponse(res, { status: 200 });
    const saved = db.verifications();
    if (saved.length !== 1 || saved[0].status_id !== 2) {
      throw new Error("Verificação não foi salva como segura");
    }
  });

  it("Deve responder 200 e salvar como perigoso quando o link é malicioso", async () => {
    const token = await loginToken();
    provider.handler = (url) => {
      if (url.includes("/result/")) return reply(200, scanResult({ malicious: true, categories: ["malware"] }));
      return reply(200, { uuid: "scan-2" });
    };

    const res = await post("/verify", { url: "https://exemplo.com" }, bearer(token));

    expectResponse(res, { status: 200 });
    const [saved] = db.verifications();
    if (!saved || saved.threat_type_id !== 2) {
      throw new Error("Verificação não foi salva com o tipo de ameaça correto");
    }
  });

  it("Deve responder 502 quando a verificação não conclui dentro do limite de tentativas (timeout de polling)", async (t) => {
    t.mock.method(console, "error", () => {});
    const token = await loginToken();
    provider.handler = (url) => {
      if (url.includes("/result/")) return reply(404, {});
      return reply(200, { uuid: "scan-3" });
    };

    const res = await post("/verify", { url: "https://exemplo.com" }, bearer(token));

    expectResponse(res, {
      status: 502,
      body: { error: h.config.ERROR_MESSAGES.TIMEOUT, code: "TIMEOUT" },
    });
  });

  it("Deve responder 502 quando a submissão inicial falha", async () => {
    const token = await loginToken();
    provider.handler = hangUntilAborted;

    const res = await post("/verify", { url: "https://exemplo.com" }, bearer(token));

    expectResponse(res, {
      status: 502,
      body: { error: h.config.ERROR_MESSAGES.NETWORK_ERROR, code: "NETWORK_ERROR" },
    });
  });
});