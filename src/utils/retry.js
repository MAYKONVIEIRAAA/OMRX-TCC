const { RETRY } = require("../config/config");

function isRetryable(error) {
  return (
    error.code === "TIMEOUT" ||
    error.code === "NETWORK_ERROR" ||
    error.status === 429 ||
    (error.status >= 500 && error.status <= 599)
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeWithRetry(operation) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const retriesExhausted = attempt >= RETRY.MAX_RETRIES;

      if (retriesExhausted || !isRetryable(error)) {
        throw error;
      }

      await sleep(RETRY.INITIAL_DELAY_MS * 2 ** attempt);
    }
  }
}

module.exports = { executeWithRetry };