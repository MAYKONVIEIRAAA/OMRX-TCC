const { checkUrlWithProvider, WebRiskError } = require("../providers/urlCheckProvider");
const { executeWithRetry } = require("../utils/retry");

async function checkUrl(targetUrl) {
  const apiKey = process.env.SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    throw new WebRiskError("SAFE_BROWSING_API_KEY não configurada", {
      code: "MISSING_API_KEY",
    });
  }

  if (typeof targetUrl !== "string" || !targetUrl.trim()) {
    throw new WebRiskError("Informe uma URL válida", {
      code: "INVALID_URL",
    });
  }

  const normalizedUrl = targetUrl.trim();

  const result = await executeWithRetry(() =>
    checkUrlWithProvider(normalizedUrl, apiKey)
  );

  const threats = result.threats || [];
  const threatTypes = threats.flatMap((t) => t.threatTypes || []);

  return {
    safe: threats.length === 0,
    threatTypes,
  };
}

module.exports = {
  checkUrl,
  WebRiskError,
};