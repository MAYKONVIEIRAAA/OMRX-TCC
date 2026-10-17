const { checkUrlWithProvider, UrlScanError } = require("../providers/urlCheckProvider");

async function checkUrl(targetUrl) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new UrlScanError("Credenciais da Cloudflare nao configuradas", { code: "MISSING_API_KEY" });
  }

  if (typeof targetUrl !== "string" || !targetUrl.trim()) {
    throw new UrlScanError("Informe uma URL valida", { code: "INVALID_URL" });
  }

  const normalizedUrl = targetUrl.trim();

  const result = await checkUrlWithProvider(normalizedUrl, accountId, apiToken);

  const overall = result?.verdicts?.overall || {};
  const phishingData = result?.meta?.processors?.phishing?.data || [];
  const domainCategories = result?.meta?.processors?.domainCategories?.data || [];
  const radarRank = result?.meta?.processors?.radarRank?.data || [];

  return {
    safe: !overall.malicious,
    malicious: overall.malicious || false,
    categories: overall.categories || [],
    tags: overall.tags || [],
    phishingType: phishingData,
    domainCategories: domainCategories.map((c) => c.name),
    domainRank: radarRank[0]?.rank ?? null,
  };
}

module.exports = {
  checkUrl,
  UrlScanError,
};