
const {
  checkUrlWithIpqs,
  WebRiskError,
} = require("./ipqsService");

const { executeWithRetry } = require("./retry");

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
    checkUrlWithIpqs(normalizedUrl, apiKey)
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
