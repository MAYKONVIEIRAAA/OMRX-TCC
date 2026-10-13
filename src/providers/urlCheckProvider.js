const { URL_CHECK_PROVIDER } = require("../config/config");

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

async function checkUrlWithProvider(targetUrl, apiKey) {
  const apiUrl = new URL(URL_CHECK_PROVIDER.BASE_URL);

  apiUrl.searchParams.set("key", apiKey);
  apiUrl.searchParams.append("urls", targetUrl);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    URL_CHECK_PROVIDER.TIMEOUT_MS
  );

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      signal: controller.signal,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new WebRiskError(
        result?.error?.message || `Erro HTTP ${response.status}`,
        {
          status: response.status,
          code: "API_ERROR",
        }
      );
    }

    return result;
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
  checkUrlWithProvider,
  WebRiskError,
};