const webRiskService = require("../services/urlRiskService");
const ERROR_MESSAGES = require("../config/errorMessages");

async function check(req, res) {
  try {
    const resultado = await webRiskService.checkUrl(req.body.url);
    return res.status(200).json(resultado);
  } catch (err) {
    if (err instanceof webRiskService.WebRiskError) {
      const mensagem = ERROR_MESSAGES[err.code] || "Nao foi possivel verificar esse link agora.";
      return res.status(err.status || 502).json({ error: mensagem, code: err.code });
    }
    return res.status(500).json({ error: "Erro inesperado ao verificar o link." });
  }
}

module.exports = { check };