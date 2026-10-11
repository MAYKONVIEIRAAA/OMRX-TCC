
const BASE_URL = "https://www.ipqualityscore.com/api/json/url";
const TIMEOUT_MS = 5000;

class WebRiskError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = "WebRiskError";
    this.status = status;
    this.code = code;

    if (cause) {
      this.cause = cause;
    }
  }
}

function buildApiUrl(targetUrl, apiKey) {
  return `${BASE_URL}/${apiKey}/${encodeURIComponent(targetUrl)}`;
}

async function checkUrlWithIpqs(targetUrl, apiKey) {
  const apiUrl = buildApiUrl(targetUrl, apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body.success === false) {
      throw new WebRiskError(
        body.message || `Erro HTTP ${response.status}`,
        {
          status: response.status,
          code: "API_ERROR",
        }
      );
    }

    return body;
  } catch (err) {
    if (err instanceof WebRiskError) {
      throw err;
    }

    if (err.name === "AbortError") {
      throw new WebRiskError("Tempo limite da API excedido", {
        code: "TIMEOUT",
        cause: err,
      });
    }

    throw new WebRiskError("Falha de comunicação com a API", {
      code: "NETWORK_ERROR",
      cause: err,
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  checkUrlWithIpqs,
  WebRiskError,
};
