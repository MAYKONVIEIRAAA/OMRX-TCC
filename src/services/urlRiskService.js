const { checkUrlWithProvider, UrlScanError } = require("../providers/urlCheckProvider");

function sumRequests(ipStats) {
  return (ipStats || []).reduce((total, ip) => total + (ip.requests || 0), 0);
}

function calculateRiskScore({ malicious, maliciousRequestCount, totalRequests, securePercentage }) {
  let score = malicious ? 60 : 0;

  if (totalRequests > 0) {
    const maliciousRatio = maliciousRequestCount / totalRequests;
    score += maliciousRatio * 25;
  }

  if (typeof securePercentage === "number") {
    const insecureRatio = (100 - securePercentage) / 100;
    score += insecureRatio * 15;
  }

  return Math.round(Math.min(score, 100));
}

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
  const page = result?.page || {};
  const task = result?.task || {};
  const stats = result?.data?.stats || {};
  const ipStats = result?.data?.stats?.ipStats || [];
  const phishingData = result?.meta?.processors?.phishing?.data || [];
  const domainCategories = result?.meta?.processors?.domainCategories?.data || [];
  const radarRank = result?.meta?.processors?.radarRank?.data || [];

  const maliciousRequestCount = stats.malicious || 0;
  const totalRequests = sumRequests(ipStats);
  const domainRank = radarRank[0]?.rank ?? null;

  return {
    safe: !overall.malicious,
    malicious: overall.malicious || false,
    riskScore: calculateRiskScore({
      malicious: overall.malicious,
      maliciousRequestCount,
      totalRequests,
      securePercentage: stats.securePercentage,
    }),
    threat: {
      categories: overall.categories || [],
      tags: overall.tags || [],
      phishingType: phishingData,
      maliciousRequestCount,
    },
    domain: {
      name: page.domain || null,
      categories: domainCategories.map((c) => c.name),
      rank: domainRank,
      country: page.country || null,
      ip: page.ip || null,
      asn: page.asnname || null,
    },
    page: {
      title: page.title || null,
      finalUrl: page.url || null,
      status: page.status || null,
      server: page.server || null,
    },
    tls: {
      issuer: page.tlsIssuer || null,
      validDays: page.tlsValidDays ?? null,
      ageDays: page.tlsAgeDays ?? null,
    },
    stats: {
      totalLinks: stats.totalLinks ?? null,
      uniqCountries: stats.uniqCountries ?? null,
      uniqASNs: stats.uniqASNs ?? null,
      totalRequests,
      secureRequests: stats.secureRequests ?? null,
      securePercentage: stats.securePercentage ?? null,
    },
    scan: {
      scannedAt: task.time || null,
      success: task.success ?? null,
    },
  };
}

module.exports = {
  checkUrl,
  UrlScanError,
};