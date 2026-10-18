const { ERROR_MESSAGES } = require("../config/config");

function requireCloudflareCredentials(req, res, next) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return res.status(502).json({
      error: ERROR_MESSAGES.MISSING_API_KEY,
      code: "MISSING_API_KEY",
    });
  }

  next();
}

module.exports = { requireCloudflareCredentials };