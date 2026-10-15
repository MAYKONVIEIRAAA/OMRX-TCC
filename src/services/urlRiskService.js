const { checkUrlWithProvider, WebRiskError } = require("../providers/urlCheckProvider");

async function checkUrl(targetUrl) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new WebRiskError("Credenciais da Cloudflare não configuradas", {
      code: "MISSING_API_KEY",
    });
  }

  if (typeof targetUrl !== "string" || !targetUrl.trim()) {
    throw new WebRiskError("Informe uma URL válida", {
      code: "INVALID_URL",
    });
  }

  const normalizedUrl = targetUrl.trim();

  const result = await checkUrlWithProvider(normalizedUrl, accountId, apiToken);

  const malicious = result?.verdicts?.overall?.malicious || false;

  return {
    safe: !malicious,
    verdict: result?.verdicts?.overall || null,
  };
}

module.exports = {
  checkUrl,
  WebRiskError,
};