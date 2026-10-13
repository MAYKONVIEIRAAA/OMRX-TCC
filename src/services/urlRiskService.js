const {
  checkUrlWithProvider,
  WebRiskError,
} = require("../providers/urlCheckProvider");

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

  let apiResponse = await executeWithRetry(() =>
    checkUrlWithProvider(normalizedUrl, apiKey)
  );

  const threats = Array.isArray(apiResponse.threats)
    ? apiResponse.threats
    : [];

  const threatTypes = [
    ...new Set(
      threats.flatMap((threat) =>
        Array.isArray(threat.threatTypes) ? threat.threatTypes : []
      )
    ),
  ];

  return {
    url: normalizedUrl,
    safe: threats.length === 0,
    threatTypes,
    threats,
    apiResponse,
  };
}

module.exports = {
  checkUrl,
  WebRiskError,
};