const {checkUrlWithProvider,WebRiskError,} = require("../providers/urlCheckProvider");
const { executeWithRetry } = require("../utils/retry");

async function checkUrl(targetUrl) {
  const apiKey = process.env.IPQS_API_KEY;

  if (!apiKey) {
    throw new WebRiskError("IPQS_API_KEY não configurada", {
      code: "MISSING_API_KEY",
    });
  }

  if (
    typeof targetUrl !== "string" ||
    !targetUrl.trim()
  ) {
    throw new WebRiskError("Informe uma URL válida", {
      code: "INVALID_URL",
    });
  }

  const normalizedUrl = targetUrl.trim();

  const result = await executeWithRetry(() =>
    checkUrlWithProvider(normalizedUrl, apiKey)
  );

  return {
    safe: !result.unsafe,
    malware: result.malware,
    phishing: result.phishing,
    suspicious: result.suspicious,
    riskScore: result.risk_score,
  };
}

module.exports = {
  checkUrl,
  WebRiskError,
};