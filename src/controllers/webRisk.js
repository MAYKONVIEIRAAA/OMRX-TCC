const webRiskService = require("../services/webRisk");

async function check(req, res) {
  try {
    const resultado = await webRiskService.checkUrl(req.body.url);
    return res.status(200).json(resultado);
  } catch (err) {
    if (err instanceof webRiskService.WebRiskError) {
      return res.status(err.status || 502).json({ error: err.message, code: err.code });
    }
    return res.status(500).json({ error: "Erro inesperado ao verificar o Link" });
  }
}

module.exports = { check };