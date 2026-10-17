const { URL_CHECK_PROVIDER } = require("../config/config");

class UrlScanError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = "UrlScanError";
    this.status = status;
    this.code = code;

    if (cause) {
      this.cause = cause;
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), URL_CHECK_PROVIDER.TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function submitScan(targetUrl, accountId, apiToken) {
  const apiUrl = `${URL_CHECK_PROVIDER.BASE_URL}/accounts/${accountId}/urlscanner/v2/scan`;

  let response;
  try {
    response = await fetchWithTimeout(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: targetUrl, visibility: "Public" }),
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new UrlScanError("Tempo limite ao enviar URL para escaneamento", {
        code: "TIMEOUT",
        cause: err,
      });
    }
    throw new UrlScanError("Falha de comunicacao com a API", {
      code: "NETWORK_ERROR",
      cause: err,
    });
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new UrlScanError(body?.errors?.[0]?.message || `Erro HTTP ${response.status}`, {
      status: response.status,
      code: "API_ERROR",
    });
  }

  return body.uuid;
}

async function pollResult(uuid, accountId, apiToken) {
  const apiUrl = `${URL_CHECK_PROVIDER.BASE_URL}/accounts/${accountId}/urlscanner/v2/result/${uuid}`;

  for (let attempt = 0; attempt < URL_CHECK_PROVIDER.MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(URL_CHECK_PROVIDER.POLL_INTERVAL_MS);

    let response;
    try {
      response = await fetchWithTimeout(apiUrl, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw new UrlScanError("Tempo limite ao consultar resultado do scan", {
          code: "TIMEOUT",
          cause: err,
        });
      }
      throw new UrlScanError("Falha de comunicacao com a API", {
        code: "NETWORK_ERROR",
        cause: err,
      });
    }

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new UrlScanError(body?.errors?.[0]?.message || `Erro HTTP ${response.status}`, {
        status: response.status,
        code: "API_ERROR",
      });
    }

    return response.json();
  }

  throw new UrlScanError("O escaneamento demorou demais para concluir", {
    code: "TIMEOUT",
  });
}

async function checkUrlWithProvider(targetUrl, accountId, apiToken) {
  const uuid = await submitScan(targetUrl, accountId, apiToken);
  return pollResult(uuid, accountId, apiToken);
}

module.exports = {
  checkUrlWithProvider,
  UrlScanError,
};