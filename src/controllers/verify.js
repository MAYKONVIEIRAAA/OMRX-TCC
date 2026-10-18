const urlRiskService = require("../services/urlRiskService");
const { toVerificationStatus } = require("../services/verificationStatus");
const { ERROR_MESSAGES } = require("../config/config");

async function verify(req, res) {
  try {
    const resultado = await urlRiskService.checkUrlAndWait(req.body.url);
    const verification = toVerificationStatus(resultado);

    return res.status(200).json({
      ...resultado,
      url: req.body.url,
      verification: verification.verification,
      message: verification.message,
    });
  } catch (err) {
    if (err instanceof urlRiskService.UrlScanError) {
      const mensagem = ERROR_MESSAGES[err.code] || "Nao foi possivel verificar esse link agora.";
      return res.status(err.status || 502).json({ error: mensagem, code: err.code });
    }
    return res.status(500).json({ error: "Erro inesperado ao verificar o link." });
  }
}

module.exports = { verify };